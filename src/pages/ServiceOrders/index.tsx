// src/pages/ServiceOrders/index.tsx
import {
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Grid,
  Stack,
  Textarea,
  NumberInput,
  Loader,
  Center,
  Modal,
  Divider,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconTrash,
  IconBrandWhatsapp,
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ServiceOrderModal } from './components/ServiceOrderModal';
import { alertApiError } from '../../utils/apiError';

type ServiceOrderStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
type ServiceOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type ServiceOrderChannel = 'PANEL' | 'WHATSAPP';

interface UserInfo {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'TECHNICIAN' | 'USER';
}

interface AssetInfo {
  id: number;
  tagNumber: string;
  name: string;
}

interface SectorInfo {
  id: number;
  name: string;
}

interface StatusHistoryEntry {
  id: number;
  previousStatus: ServiceOrderStatus | null;
  newStatus: ServiceOrderStatus;
  changedBy: string;
  note?: string | null;
  createdAt: string;
}

interface ServiceOrder {
  id: number;
  title: string;
  description: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  channel: ServiceOrderChannel;
  requester: UserInfo;
  technician?: UserInfo | null;
  asset?: AssetInfo | null;
  sector: SectorInfo;
  solutionDetails?: string | null;
  closedAt?: string | null;
  cost?: number | null;
  createdAt?: string;
}

const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'orange',
  RESOLVED: 'green',
  CANCELLED: 'gray',
};

const PRIORITY_LABELS: Record<ServiceOrderPriority, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const PRIORITY_COLORS: Record<ServiceOrderPriority, string> = {
  LOW: 'gray',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

export function ServiceOrdersScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const canResolve = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [technicians, setTechnicians] = useState<UserInfo[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // A OS selecionada é exibida no modal de detalhes (aberto pelo olho ou clicando na linha)
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const selectedOrderId = selectedOrder?.id ?? null;
  const [technicianToAssign, setTechnicianToAssign] = useState<string | null>(null);
  const [solutionDetails, setSolutionDetails] = useState('');
  const [resolutionCost, setResolutionCost] = useState<number | string>('');
  const [savingChanges, setSavingChanges] = useState(false);
  const [history, setHistory] = useState<{ orderId: number; entries: StatusHistoryEntry[] } | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await api.get('/users', { params: { role: 'TECHNICIAN', size: 1000, sort: 'name,asc' } });
      setTechnicians(extractData(response));
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação, busca e filtros feitos no backend (mais recentes primeiro)
  const pagination = useServerPagination<ServiceOrder>(
    '/service-orders',
    { q: debouncedSearch, status: statusFilter, channel: channelFilter },
    { sort: 'createdAt,desc' }
  );

  // Ações da OS devolvem a OS atualizada: atualiza o painel e recarrega a página da tabela
  const applyUpdatedOrder = (updated: ServiceOrder) => {
    setSelectedOrder(updated);
    pagination.reload();
  };

  useEffect(() => {
    if (selectedOrder) {
      setTechnicianToAssign(selectedOrder.technician ? String(selectedOrder.technician.id) : null);
      setSolutionDetails(selectedOrder.solutionDetails || '');
      setResolutionCost('');
    }
  }, [selectedOrder]);

  const selectedOrderStatus = selectedOrder?.status;

  // Recarrega o histórico ao selecionar outra OS ou quando o status dela muda
  useEffect(() => {
    if (selectedOrderId === null) return;
    let cancelled = false;
    api
      .get(`/service-orders/${selectedOrderId}/status-history?size=100`)
      .then((res) => {
        if (!cancelled) setHistory({ orderId: selectedOrderId, entries: extractData(res) });
      })
      .catch((error) => console.error('Erro ao buscar histórico de status:', error));
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId, selectedOrderStatus]);

  const statusHistory = history && history.orderId === selectedOrderId ? history.entries : [];

  const handleSelectOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar esta ordem de serviço?')) {
      try {
        await api.delete(`/service-orders/${id}`);
        if (selectedOrderId === id) setSelectedOrder(null);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar ordem de serviço.');
      }
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedOrder || !technicianToAssign) return;
    try {
      setSavingChanges(true);
      const response = await api.patch(`/service-orders/${selectedOrder.id}/assign-technician/${technicianToAssign}`);
      applyUpdatedOrder(response.data);
    } catch (error) {
      alertApiError(error, 'Erro ao atribuir técnico.');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedOrder || !solutionDetails.trim()) return;
    try {
      setSavingChanges(true);
      // O backend recebe o laudo como String crua (@RequestBody String): enviar como texto puro
      // evita que ele seja salvo com aspas e com "\n" literais no lugar das quebras de linha.
      const response = await api.patch(`/service-orders/${selectedOrder.id}/resolve`, solutionDetails, {
        headers: { 'Content-Type': 'text/plain' },
        params: resolutionCost !== '' ? { cost: resolutionCost } : undefined,
      });
      applyUpdatedOrder(response.data);
    } catch (error) {
      alertApiError(error, 'Erro ao finalizar ordem de serviço.');
    } finally {
      setSavingChanges(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;
    if (!confirm('Deseja realmente cancelar esta ordem de serviço? Essa ação não pode ser desfeita.')) return;
    try {
      setSavingChanges(true);
      const response = await api.patch(`/service-orders/${selectedOrder.id}/status`, { status: 'CANCELLED' });
      applyUpdatedOrder(response.data);
    } catch (error) {
      alertApiError(error, 'Erro ao cancelar ordem de serviço.');
    } finally {
      setSavingChanges(false);
    }
  };

  if (pagination.initialLoading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <ServiceOrderModal
        opened={modalOpened}
        onClose={closeModal}
        onSuccess={pagination.reload}
      />

      {/* 1. CABEÇALHO */}
      <Group justify="space-between">
        <Title order={2} fw={700}>Ordens de Serviço</Title>
        <Button leftSection={<IconPlus size={16} />} radius="md" color="blue.6" onClick={openModal}>
          Nova OS
        </Button>
      </Group>

      {/* 2. FILTROS DA LISTAGEM */}
      <Paper p="md" radius="md" withBorder>
        <Grid columns={12} align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              placeholder="Buscar por título, solicitante ou setor..."
              leftSection={<IconSearch size={16} color="gray" />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
              radius="md"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              placeholder="Filtrar por status"
              data={[
                { value: 'OPEN', label: 'Aberta' },
                { value: 'IN_PROGRESS', label: 'Em Andamento' },
                { value: 'RESOLVED', label: 'Finalizada' },
                { value: 'CANCELLED', label: 'Cancelada' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              radius="md"
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Select
              placeholder="Filtrar por canal"
              data={[
                { value: 'PANEL', label: 'Painel' },
                { value: 'WHATSAPP', label: 'WhatsApp' },
              ]}
              value={channelFilter}
              onChange={setChannelFilter}
              radius="md"
              clearable
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* 3. TABELA DE ORDENS DE SERVIÇO */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>TÍTULO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>SOLICITANTE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>SETOR</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>TÉCNICO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>PRIORIDADE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px' }}>STATUS</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '12px', textAlign: 'center' }}>AÇÕES</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((order) => (
                <Table.Tr
                  key={order.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectOrder(order)}
                  bg={order.id === selectedOrderId ? '#f1f3f5' : undefined}
                >
                  <Table.Td fw={700}>
                    <Group gap={6} wrap="nowrap">
                      {order.channel === 'WHATSAPP' && (
                        <IconBrandWhatsapp size={16} color="#25D366" title="Aberta via WhatsApp" />
                      )}
                      {order.title}
                    </Group>
                  </Table.Td>
                  <Table.Td>{order.requester?.name}</Table.Td>
                  <Table.Td>{order.sector?.name}</Table.Td>
                  <Table.Td>{order.technician?.name || '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={PRIORITY_COLORS[order.priority]} variant="light" size="md" radius="sm" fw={600}>
                      {PRIORITY_LABELS[order.priority]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[order.status]} variant="light" size="md" radius="sm" fw={600}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs" justify="center">
                      <ActionIcon variant="subtle" color="gray.6" onClick={() => handleSelectOrder(order)}>
                        <IconEye size={18} />
                      </ActionIcon>
                      {isAdmin && (
                        <ActionIcon variant="subtle" color="red.6" onClick={() => handleDelete(order.id)}>
                          <IconTrash size={18} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhuma ordem de serviço encontrada.
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <TablePagination {...pagination} disabled={pagination.loading} />
      </Paper>

      {/* 4. MODAL DE DETALHAMENTO DA OS SELECIONADA */}
      <Modal
        opened={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        title={<Text fw={700} size="lg">{selectedOrder ? `OS #${selectedOrder.id} — ${selectedOrder.title}` : ''}</Text>}
        size="xl"
        radius="md"
        centered
      >
      {selectedOrder && (
        <>
          <Grid columns={12} gap="xl">
            {/* Coluna Esquerda: Informações do Chamado */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <div>
                  <Text fw={700} size="md" mb="sm">Informações da OS</Text>
                  <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Título:</Text><Text size="sm" fw={500}>{selectedOrder.title}</Text></Group>
                  {selectedOrder.createdAt && (
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Data Abertura:</Text><Text size="sm" fw={500}>{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</Text></Group>
                  )}
                  <Group gap="xs" mt={4} align="center">
                    <Text size="sm" c="dimmed" w={110}>Status Atual:</Text>
                    <Badge color={STATUS_COLORS[selectedOrder.status]} radius="sm" fw={600}>{STATUS_LABELS[selectedOrder.status]}</Badge>
                  </Group>
                  <Group gap="xs" mt={4} align="center">
                    <Text size="sm" c="dimmed" w={110}>Prioridade:</Text>
                    <Badge color={PRIORITY_COLORS[selectedOrder.priority]} radius="sm" fw={600}>{PRIORITY_LABELS[selectedOrder.priority]}</Badge>
                  </Group>
                  <Group gap="xs" mt={4} align="center">
                    <Text size="sm" c="dimmed" w={110}>Origem:</Text>
                    {selectedOrder.channel === 'WHATSAPP' ? (
                      <Badge color="green" variant="light" radius="sm" fw={600} leftSection={<IconBrandWhatsapp size={14} />}>
                        WhatsApp
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light" radius="sm" fw={600}>Painel</Badge>
                    )}
                  </Group>
                </div>

                <div>
                  <Text fw={700} size="md" mb="sm" mt="xs">Solicitante</Text>
                  <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Nome:</Text><Text size="sm" fw={500}>{selectedOrder.requester?.name}</Text></Group>
                  {selectedOrder.requester?.email?.startsWith('whatsapp+') ? (
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Telefone:</Text><Text size="sm" fw={500}>{selectedOrder.requester?.phone || selectedOrder.requester?.email}</Text></Group>
                  ) : (
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Email:</Text><Text size="sm" fw={500}>{selectedOrder.requester?.email}</Text></Group>
                  )}
                  <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Setor:</Text><Text size="sm" fw={500}>{selectedOrder.sector?.name}</Text></Group>
                </div>

                {selectedOrder.asset && (
                  <div>
                    <Text fw={700} size="md" mb="sm" mt="xs">Ativo Vinculado</Text>
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Tombamento:</Text><Text size="sm" fw={500}>{selectedOrder.asset.tagNumber}</Text></Group>
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Item:</Text><Text size="sm" fw={500}>{selectedOrder.asset.name}</Text></Group>
                  </div>
                )}

                <div>
                  <Text fw={700} size="md" mb="xs" mt="xs">Descrição do Problema</Text>
                  <Paper p="sm" withBorder radius="sm" bg="#fafafa">
                    <Text size="sm" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedOrder.description}</Text>
                  </Paper>
                </div>

                {/* Quem não pode resolver só visualiza a solução registrada */}
                {!canResolve && (
                  <div>
                    <Text fw={700} size="md" mb="xs" mt="xs">Técnico e Solução</Text>
                    <Group gap="xs" mt={4}><Text size="sm" c="dimmed" w={110}>Técnico:</Text><Text size="sm" fw={500}>{selectedOrder.technician?.name || 'Não atribuído'}</Text></Group>
                    {selectedOrder.solutionDetails && (
                      <Paper p="sm" mt="xs" withBorder radius="sm" bg="#fafafa">
                        <Text size="sm" style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedOrder.solutionDetails}</Text>
                      </Paper>
                    )}
                    {selectedOrder.closedAt && (
                      <Text size="xs" c="dimmed" mt={4}>
                        Finalizada em {new Date(selectedOrder.closedAt).toLocaleString('pt-BR')}
                      </Text>
                    )}
                  </div>
                )}
              </Stack>
            </Grid.Col>

            {/* Coluna Direita: Ações Técnicas */}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                {isAdmin && (
                  <div>
                    <Text fw={700} size="md" mb="sm">Técnico Responsável</Text>
                    <Group grow align="end">
                      <Select
                        placeholder="Selecione um técnico"
                        data={technicians.map((t) => ({ value: String(t.id), label: t.name }))}
                        value={technicianToAssign}
                        onChange={setTechnicianToAssign}
                        radius="md"
                        disabled={selectedOrder.status === 'RESOLVED' || selectedOrder.status === 'CANCELLED'}
                      />
                      <Button
                        radius="md"
                        color="blue.6"
                        loading={savingChanges}
                        disabled={!technicianToAssign || selectedOrder.status === 'RESOLVED' || selectedOrder.status === 'CANCELLED'}
                        onClick={handleAssignTechnician}
                      >
                        Atribuir
                      </Button>
                    </Group>
                  </div>
                )}

                {canResolve && (
                  <>
                    <div>
                      <Text fw={700} size="md" mb="xs">
                        {selectedOrder.status === 'RESOLVED' ? 'Solução Registrada' : 'Registrar Solução'}
                      </Text>
                      <Textarea
                        placeholder="Descreva a solução aplicada..."
                        value={solutionDetails}
                        onChange={(e) => setSolutionDetails(e.currentTarget.value)}
                        rows={4}
                        radius="md"
                        disabled={selectedOrder.status === 'RESOLVED' || selectedOrder.status === 'CANCELLED'}
                      />
                      {selectedOrder.closedAt && (
                        <Text size="xs" c="dimmed" mt={4}>
                          Finalizada em {new Date(selectedOrder.closedAt).toLocaleString('pt-BR')}
                          {selectedOrder.cost != null &&
                            ` — Custo: ${selectedOrder.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        </Text>
                      )}
                    </div>

                    {selectedOrder.status !== 'RESOLVED' && selectedOrder.status !== 'CANCELLED' && (
                      <NumberInput
                        label="Custo da Manutenção (R$, opcional)"
                        placeholder="0,00"
                        min={0}
                        decimalScale={2}
                        radius="md"
                        value={resolutionCost}
                        onChange={setResolutionCost}
                      />
                    )}

                    <Button
                      fullWidth
                      size="md"
                      radius="md"
                      color="green.6"
                      mt="sm"
                      loading={savingChanges}
                      disabled={!solutionDetails.trim() || selectedOrder.status === 'RESOLVED' || selectedOrder.status === 'CANCELLED'}
                      onClick={handleResolve}
                    >
                      Finalizar OS
                    </Button>

                    {selectedOrder.status !== 'RESOLVED' && selectedOrder.status !== 'CANCELLED' && (
                      <Button
                        fullWidth
                        size="md"
                        radius="md"
                        color="red.6"
                        variant="light"
                        loading={savingChanges}
                        onClick={handleCancel}
                      >
                        Cancelar OS
                      </Button>
                    )}
                  </>
                )}
              </Stack>
            </Grid.Col>
          </Grid>

          <div>
            <Divider my="lg" />
            <Text fw={700} size="md" mb="sm">Histórico de Status</Text>
            {statusHistory.length > 0 ? (
              <Stack gap="xs">
                {statusHistory.map((entry) => (
                  <Group key={entry.id} gap="sm" wrap="nowrap" align="flex-start">
                    <Text size="xs" c="dimmed" w={130} style={{ flexShrink: 0 }}>
                      {new Date(entry.createdAt).toLocaleString('pt-BR')}
                    </Text>
                    <div>
                      <Group gap={6}>
                        {entry.previousStatus && (
                          <>
                            <Badge color={STATUS_COLORS[entry.previousStatus]} variant="light" size="sm" radius="sm">
                              {STATUS_LABELS[entry.previousStatus]}
                            </Badge>
                            <Text size="xs" c="dimmed">→</Text>
                          </>
                        )}
                        <Badge color={STATUS_COLORS[entry.newStatus]} variant="light" size="sm" radius="sm">
                          {STATUS_LABELS[entry.newStatus]}
                        </Badge>
                        <Text size="xs" c="dimmed">por {entry.changedBy}</Text>
                      </Group>
                      {entry.note && <Text size="xs" mt={2}>{entry.note}</Text>}
                    </div>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">Nenhuma alteração de status registrada para esta OS.</Text>
            )}
          </div>
        </>
      )}
      </Modal>
    </Stack>
  );
}
