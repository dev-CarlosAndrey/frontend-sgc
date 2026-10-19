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
import { MaterialModal } from './components/MaterialModal';
import { alertApiError } from '../../utils/apiError';

interface Material {
  id: number;
  name: string;
  category: string;
  active: boolean;
  createdAt?: string;
}

interface MaterialToEdit {
  id: number;
  name: string;
  category: string;
}

export function MaterialsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [materialToEdit, setMaterialToEdit] = useState<MaterialToEdit | null>(null);


  const handleCreateNew = () => {
    setMaterialToEdit(null);
    openModal();
  };

  const handleEdit = (material: Material) => {
    setMaterialToEdit({
      id: material.id,
      name: material.name,
      category: material.category,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este material?')) {
      try {
        await api.delete(`/materials/${id}`);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar material.');
      }
    }
  };

  // Formatação amigável do ID ex: MAT-001
  const formatCode = (id: number) => {
    return `MAT-${String(id).padStart(3, '0')}`;
  };

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação e busca feitas no backend
  const pagination = useServerPagination<Material>('/materials', { q: debouncedSearch }, { sort: 'name,asc' });

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
        <MaterialModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={pagination.reload}
          materialToEdit={materialToEdit}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Cadastro de Materiais</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Adicionar
          </Button>
        )}
      </Group>

      {/* 2. FILTRO DE BUSCA */}
      <div style={{ maxWidth: '400px' }}>
        <TextInput
          placeholder="Buscar material..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
        />
      </div>

      {/* 3. TABELA DE MATERIAIS */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ID</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME DO MATERIAL</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>CATEGORIA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((material) => (
                <Table.Tr key={material.id}>
                  {/* Código Formatado MAT-00X */}
                  <Table.Td c="dimmed" fw={500} style={{ fontSize: '13px' }}>
                    {formatCode(material.id)}
                  </Table.Td>

                  {/* Nome do Material */}
                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {material.name}
                  </Table.Td>

                  {/* Categoria */}
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {material.category}
                  </Table.Td>

                  {/* Status */}
                  <Table.Td>
                    {material.active ? (
                      <Badge variant="light" color="green" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="light" color="gray" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Inativo
                      </Badge>
                    )}
                  </Table.Td>

                  {/* Ações */}
                  {isAdmin && (
                    <Table.Td>
                      <Group gap="xs" justify="center" wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(material)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(material.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum material encontrado.
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