import { 
  Title, 
  Text, 
  Paper, 
  Group, 
  Button, 
  Table, 
  ThemeIcon, 
  ActionIcon, 
  Stack,
  Select,
  Loader,
  Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, 
  IconBuilding, 
  IconMapPin, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { BuildingModal } from './components/BuildingModal';
import { alertApiError } from '../../utils/apiError';

interface Company {
  id: number;
  companyName: string;
  cnpj: string;
}

interface Building {
  id: number;
  code: string;
  name: string;
  address: string;
  companyId: number;
  companyName: string;
  linkedSectorsCount: number;
}

export function PhysicalStructureScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);

  // Busca lista de Empresas cadastradas no backend
  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await api.get('/companies?size=1000');
      const data: Company[] = response.data.content ? response.data.content : response.data;
      setCompanies(data);
      
      if (data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(String(data[0].id));
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoadingCompanies(false);
    }
  }, [selectedCompanyId]);

  // Busca Prédios filtrando pela Empresa Selecionada
  const fetchBuildings = useCallback(async () => {
    if (!selectedCompanyId) return;
    try {
      setLoadingBuildings(true);
      const response = await api.get(`/buildings/company/${selectedCompanyId}?size=1000`);
      const data: Building[] = response.data.content ? response.data.content : response.data;
      setBuildings(data);
    } catch (error) {
      console.error('Erro ao buscar prédios:', error);
    } finally {
      setLoadingBuildings(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  const activeCompany = companies.find((c) => String(c.id) === selectedCompanyId);

  const handleCreateNew = () => {
    setBuildingToEdit(null);
    openModal();
  };

  const handleEditBuilding = (building: Building) => {
    setBuildingToEdit(building);
    openModal();
  };

  const handleDeleteBuilding = async (id: number) => {
    if (confirm('Deseja realmente inativar este prédio?')) {
      try {
        await api.delete(`/buildings/${id}`);
        fetchBuildings();
      } catch (error) {
        alertApiError(error, 'Erro ao excluir prédio.');
      }
    }
  };

  if (loadingCompanies && companies.length === 0) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <BuildingModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={fetchBuildings}
          companies={companies}
          buildingToEdit={buildingToEdit}
          defaultCompanyId={selectedCompanyId ? Number(selectedCompanyId) : null}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between">
        <Title order={2} fw={700}>Unidades e Prédios</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} color="#ffffff" />}
            radius="md"
            color="blue.6"
            c="white"
            onClick={handleCreateNew}
            disabled={!selectedCompanyId}
          >
            Adicionar Prédio
          </Button>
        )}
      </Group>

      {/* 2. CARD E SELETOR DE EMPRESA */}
      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Select
            label="FILTRAR POR INSTITUIÇÃO"
            placeholder="Selecione a Empresa"
            data={companies.map((c) => ({ value: String(c.id), label: c.companyName }))}
            value={selectedCompanyId}
            onChange={setSelectedCompanyId}
            style={{ maxWidth: 350 }}
            styles={{ label: { fontSize: '11px', fontWeight: 700, color: '#868e96', marginBottom: '6px' } }}
          />

          {activeCompany && (
            <Group gap="lg" align="center" mt="xs">
              <ThemeIcon color="blue.0" c="blue.6" size={54} radius="md">
                <IconBuilding size={28} stroke={1.5} />
              </ThemeIcon>
              <Stack gap={2}>
                <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>
                  {activeCompany.companyName}
                </Text>
                <Group gap="xl" mt={2}>
                  <Text size="sm" c="dimmed">
                    <Text component="span" fw={600} c="gray.7">CNPJ:</Text> {activeCompany.cnpj}
                  </Text>
                  <Text size="sm" c="dimmed">
                    <Text component="span" fw={600} c="gray.7">Total de Prédios:</Text> {buildings.length}
                  </Text>
                </Group>
              </Stack>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* 3. LISTAGEM DE PRÉDIOS VINCULADOS */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
          <Text fw={700} size="md" c="gray.8">Prédios Vinculados</Text>
        </div>

        {loadingBuildings ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : (
          <Table verticalSpacing="lg" horizontalSpacing="xl" highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px' }}>NOME DO PRÉDIO</Table.Th>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px' }}>REFERÊNCIA / ENDEREÇO</Table.Th>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', textAlign: 'center' }}>QTD. DE SETORES VINCULADOS</Table.Th>
                {isAdmin && (
                  <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', textAlign: 'center' }}>AÇÕES</Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>
            
            <Table.Tbody>
              {buildings.length > 0 ? (
                buildings.map((building) => (
                  <Table.Tr key={building.id}>
                    {/* Coluna Nome e Código */}
                    <Table.Td>
                      <Group gap="md">
                        <ThemeIcon color="blue.0" c="blue.6" size={40} radius="md">
                          <IconBuilding size={20} stroke={1.5} />
                        </ThemeIcon>
                        <Stack gap={0}>
                          <Text fw={700} size="sm" c="gray.8">{building.name}</Text>
                          <Text size="xs" c="dimmed" fw={500}>{building.code}</Text>
                        </Stack>
                      </Group>
                    </Table.Td>

                    {/* Coluna Endereço */}
                    <Table.Td>
                      <Group gap="xs" c="dimmed">
                        <IconMapPin size={16} color="gray" />
                        <Text size="sm" fw={500} c="gray.7">{building.address}</Text>
                      </Group>
                    </Table.Td>

                    {/* Coluna Quantidade de Setores com Badge Numérico */}
                    <Table.Td style={{ textAlign: 'center' }}>
                      <ThemeIcon color="blue.0" c="blue.6" size={32} radius="md" style={{ margin: '0 auto', fontWeight: 700, fontSize: '14px' }}>
                        {building.linkedSectorsCount}
                      </ThemeIcon>
                    </Table.Td>

                    {/* Coluna Ações */}
                    {isAdmin && (
                      <Table.Td>
                        <Group gap="sm" justify="center">
                          <ActionIcon variant="subtle" color="blue.6" onClick={() => handleEditBuilding(building)}>
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red.6" onClick={() => handleDeleteBuilding(building.id)}>
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={isAdmin ? 4 : 3}>
                    <Text ta="center" c="dimmed" py="xl">
                      Nenhum prédio cadastrado para a empresa selecionada.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}