import { 
  Title, 
  Paper, 
  Group, 
  Button, 
  TextInput, 
  Table, 
  Badge, 
  ActionIcon, 
  Stack,
  Loader,
  Center
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';
import { useState } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { SectorModal } from './components/SectorModal';
import { alertApiError } from '../../utils/apiError';

interface BuildingInfo {
  id: number;
  name: string;
}

interface SectorResponse {
  id: number;
  name: string;
  building?: BuildingInfo;
  managerId?: number;
  managerName?: string;
  totalAssets?: number;
  activeTickets?: number;
  active: boolean;
}

interface SectorToEdit {
  id: number;
  name: string;
  buildingId?: number;
  managerId?: number;
}

export function SectorsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorToEdit, setSectorToEdit] = useState<SectorToEdit | null>(null);


  const handleCreateNew = () => {
    setSectorToEdit(null);
    openModal();
  };

  const handleEdit = (sector: SectorResponse) => {
    setSectorToEdit({
      id: sector.id,
      name: sector.name,
      buildingId: sector.building?.id,
      managerId: sector.managerId,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este setor?')) {
      try {
        await api.delete(`/sectors/${id}`);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar setor.');
      }
    }
  };

  const formatCode = (id: number) => `SET-${String(id).padStart(3, '0')}`;

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação e busca feitas no backend
  const pagination = useServerPagination<SectorResponse>('/sectors', { q: debouncedSearch }, { sort: 'name,asc' });

  if (pagination.initialLoading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <SectorModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={pagination.reload}
          sectorToEdit={sectorToEdit}
        />
      )}

      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Gestão de Setores</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Adicionar Setor
          </Button>
        )}
      </Group>

      <div style={{ maxWidth: '400px' }}>
        <TextInput
          placeholder="Buscar por setor, prédio ou responsável..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
        />
      </div>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ID</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME DO SETOR</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>PRÉDIO / UNIDADE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>RESPONSÁVEL / GERENTE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((sector) => (
                <Table.Tr key={sector.id}>
                  <Table.Td c="dimmed" fw={500} style={{ fontSize: '13px' }}>
                    {formatCode(sector.id)}
                  </Table.Td>

                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {sector.name}
                  </Table.Td>

                  <Table.Td c="gray.7" fw={600} style={{ fontSize: '14px' }}>
                    {sector.building?.name || '-'}
                  </Table.Td>

                  <Table.Td c="gray.7" fw={600} style={{ fontSize: '14px' }}>
                    {sector.managerName || 'Sem responsável'}
                  </Table.Td>

                  <Table.Td>
                    {sector.active ? (
                      <Badge variant="light" color="green" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="light" color="gray" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Inativo
                      </Badge>
                    )}
                  </Table.Td>

                  {isAdmin && (
                    <Table.Td>
                      <Group gap="xs" justify="center" wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(sector)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(sector.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum setor encontrado.
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <TablePagination {...pagination} disabled={pagination.loading} />
      </Paper>
    </Stack>
  );
}