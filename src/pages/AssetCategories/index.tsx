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
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../hooks/usePagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AssetCategoryModal } from './components/AssetCategoryModal';
import { alertApiError } from '../../utils/apiError';

interface AssetCategory {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  createdAt?: string;
}

interface AssetCategoryToEdit {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

export function AssetCategoriesScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryToEdit, setCategoryToEdit] = useState<AssetCategoryToEdit | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/asset-categories?size=1000');
      setCategories(extractData(response));
    } catch (error) {
      console.error('Erro ao buscar categorias de bens:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateNew = () => {
    setCategoryToEdit(null);
    openModal();
  };

  const handleEdit = (category: AssetCategory) => {
    setCategoryToEdit({
      id: category.id,
      name: category.name,
      description: category.description,
      active: category.active,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar esta categoria?')) {
      try {
        await api.delete(`/asset-categories/${id}`);
        fetchCategories();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar categoria.');
      }
    }
  };

  const formatCode = (id: number) => `CAT-${String(id).padStart(3, '0')}`;

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pagination = usePagination(filteredCategories);

  if (loading && categories.length === 0) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <AssetCategoryModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={fetchCategories}
          categoryToEdit={categoryToEdit}
        />
      )}

      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Categorias de Bens</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Adicionar Categoria
          </Button>
        )}
      </Group>

      <div style={{ maxWidth: '400px' }}>
        <TextInput
          placeholder="Buscar categoria..."
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
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DESCRIÇÃO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {filteredCategories.length > 0 ? (
              pagination.pageItems.map((category) => (
                <Table.Tr key={category.id}>
                  <Table.Td c="dimmed" fw={500} style={{ fontSize: '13px' }}>
                    {formatCode(category.id)}
                  </Table.Td>

                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {category.name}
                  </Table.Td>

                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {category.description || '-'}
                  </Table.Td>

                  <Table.Td>
                    {category.active ? (
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
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(category)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(category.id)}>
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
                    Nenhuma categoria encontrada.
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <TablePagination {...pagination} />
      </Paper>
    </Stack>
  );
}
