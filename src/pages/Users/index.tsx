import {
  Title,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
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
import { UserModal } from './components/UserModal';

type Role = 'ADMIN' | 'TECHNICIAN' | 'USER';

interface UserRow {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active: boolean;
  createdAt?: string;
}

interface UserToEdit {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  TECHNICIAN: 'Técnico',
  USER: 'Usuário',
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: 'grape',
  TECHNICIAN: 'blue',
  USER: 'gray',
};

export function UsersScreen() {
  const { user: loggedUser } = useAuth();
  const isAdmin = loggedUser?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserToEdit | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?size=1000');
      setUsers(extractData(response));
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateNew = () => {
    setUserToEdit(null);
    openModal();
  };

  const handleEdit = (user: UserRow) => {
    setUserToEdit({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este usuário?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        console.error('Erro ao inativar usuário:', error);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const pagination = usePagination(filteredUsers);

  if (loading && users.length === 0) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <UserModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={fetchUsers}
          userToEdit={userToEdit}
        />
      )}

      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Usuários do Sistema</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Cadastrar Usuário
          </Button>
        )}
      </Group>

      <Group gap="md" grow wrap="wrap">
        <TextInput
          placeholder="Buscar por nome ou e-mail..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 2 }}
        />
        <Select
          placeholder="Filtrar por Perfil"
          data={[
            { value: 'ADMIN', label: 'Administrador' },
            { value: 'TECHNICIAN', label: 'Técnico' },
            { value: 'USER', label: 'Usuário' },
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
          radius="md"
          clearable
        />
      </Group>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME (LOGIN)</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>E-MAIL</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>TELEFONE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>PERFIL</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {filteredUsers.length > 0 ? (
              pagination.pageItems.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {u.name}
                  </Table.Td>
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {u.email}
                  </Table.Td>
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {u.phone || '-'}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ROLE_COLORS[u.role]} radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {u.active ? (
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
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(u)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(u.id)}>
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
                    Nenhum usuário encontrado.
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
