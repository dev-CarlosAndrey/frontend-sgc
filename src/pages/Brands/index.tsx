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
  Center,
  Text
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import { IconPlus, IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { BrandModal } from './components/BrandModal';
import { alertApiError } from '../../utils/apiError';

interface Brand {
  id: number;
  name: string;
  active: boolean;
}

interface BrandToEdit {
  id: number;
  name: string;
}

export function BrandsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [opened, { open, close }] = useDisclosure(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [brandToEdit, setBrandToEdit] = useState<BrandToEdit | null>(null);

  // Paginação e busca feitas no backend
  const pagination = useServerPagination<Brand>('/brands', { q: debouncedSearch }, { sort: 'name,asc' });

  const handleCreateNew = () => {
    setBrandToEdit(null);
    open();
  };

  const handleEdit = (brand: Brand) => {
    setBrandToEdit({ id: brand.id, name: brand.name });
    open();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar esta marca?')) {
      try {
        await api.delete(`/brands/${id}`);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar marca.');
      }
    }
  };

  return (
    <Stack gap="lg">
      {/* MODAL ISOLADO DE CRIAÇÃO/EDIÇÃO */}
      {isAdmin && (
        <BrandModal
          opened={opened}
          onClose={close}
          onSuccess={pagination.reload}
          brandToEdit={brandToEdit}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Gestão de Marcas</Title>
        {isAdmin && (
          <Button leftSection={<IconPlus size={16} />} radius="md" color="blue.6" onClick={handleCreateNew}>
            Adicionar
          </Button>
        )}
      </Group>

      {/* 2. BARRA DE FILTRO */}
      <Group gap="md">
        <TextInput
          placeholder="Buscar marca..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ maxWidth: '400px', width: '100%' }}
        />
      </Group>

      {/* 3. TABELA DE CADASTRO DE MARCAS */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        {pagination.initialLoading ? (
          <Center p="xl">
            <Loader size="md" />
          </Center>
        ) : (
          <>
          <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover style={{ opacity: pagination.loading ? 0.6 : 1 }}>
            <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
              <Table.Tr>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ID</Table.Th>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME DA MARCA</Table.Th>
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
                {isAdmin && (
                  <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {pagination.items.length > 0 ? (
                pagination.items.map((brand) => (
                  <Table.Tr key={brand.id}>
                    {/* Formatação ID BRD-001 conforme seu padrão visual */}
                    <Table.Td c="gray.5" fw={500} style={{ fontSize: '13px' }}>
                      BRD-{String(brand.id).padStart(3, '0')}
                    </Table.Td>

                    <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                      {brand.name}
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        variant="light"
                        color={brand.active ? 'green' : 'gray'}
                        radius="md"
                        size="md"
                        px="xs"
                        style={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        {brand.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </Table.Td>

                    {isAdmin && (
                      <Table.Td>
                        <Group gap="xs" justify="center" wrap="nowrap">
                          <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(brand)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(brand.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={isAdmin ? 4 : 3}>
                    <Text ta="center" c="dimmed" py="md">
                      Nenhuma marca cadastrada ou encontrada.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>

          <TablePagination {...pagination} disabled={pagination.loading} />
          </>
        )}
      </Paper>
    </Stack>
  );
}
