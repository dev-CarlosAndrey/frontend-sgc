import { 
  Title, 
  Paper, 
  Group, 
  Button, 
  TextInput, 
  Select, 
  Table, 
  Avatar, 
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
  IconEye, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { EmployeeModal } from './components/EmployeeModal';
import { alertApiError } from '../../utils/apiError';

interface Employee {
  id: number;
  name: string;
  cpf: string;
  registrationNumber: string;
  email?: string;
  phone?: string;
  position?: string;
  admissionDate?: string;
  active: boolean;
  companyId: number;
  companyName?: string;
  sectorId?: number;
  sectorName?: string;
}

interface CompanyOption {
  id: number;
  companyName?: string;
  name?: string;
}

interface SectorOption {
  id: number;
  name: string;
}

interface EmployeeToEdit {
  id: number;
  name: string;
  cpf: string;
  registrationNumber: string;
  email?: string;
  phone?: string;
  position?: string;
  admissionDate?: string;
  companyId: number;
  sectorId?: number;
}

export function EmployeesScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeToEdit | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Normalizador auxiliar para tratar respostas do Spring Boot (Array simples ou PageImpl)
  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  // Empresas e setores: usados pelo modal de cadastro e pelo filtro de setor
  const fetchOptions = useCallback(async () => {
    const [companiesRes, sectorsRes] = await Promise.allSettled([
      api.get('/companies?size=1000'),
      api.get('/sectors?size=1000&sort=name,asc'),
    ]);

    if (companiesRes.status === 'fulfilled') {
      setCompanies(extractData(companiesRes.value));
    }
    if (sectorsRes.status === 'fulfilled') {
      setSectors(extractData(sectorsRes.value));
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const handleCreateNew = () => {
    setEmployeeToEdit(null);
    openModal();
  };

  const handleEdit = (employee: Employee) => {
    setEmployeeToEdit({
      id: employee.id,
      name: employee.name,
      cpf: employee.cpf,
      registrationNumber: employee.registrationNumber,
      email: employee.email,
      phone: employee.phone,
      position: employee.position,
      admissionDate: employee.admissionDate,
      companyId: employee.companyId,
      sectorId: employee.sectorId,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este funcionário?')) {
      try {
        await api.delete(`/employees/${id}`);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar funcionário.');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const AVATAR_COLORS = ['blue', 'teal', 'orange', 'violet', 'red', 'indigo', 'cyan'];

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação, busca e filtros feitos no backend. Sem filtro de status,
  // o backend lista ativos e inativos.
  const pagination = useServerPagination<Employee>(
    '/employees',
    {
      q: debouncedSearch,
      sectorId: departmentFilter,
      active: statusFilter === 'Active' ? true : statusFilter === 'Inactive' ? false : null,
    },
    { sort: 'name,asc' }
  );

  // O filtro envia o id do setor
  const sectorOptions = sectors.map((s) => ({ value: String(s.id), label: s.name }));

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
        <EmployeeModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={pagination.reload}
          companies={companies}
          sectors={sectors}
          employeeToEdit={employeeToEdit}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Gestão de Funcionários</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Cadastrar Funcionário
          </Button>
        )}
      </Group>

      {/* 2. FILTROS DA TABELA */}
      <Group gap="md" grow wrap="wrap">
        <TextInput
          placeholder="Buscar por nome, CPF ou matrícula"
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 2 }}
        />
        <Select
          placeholder="Filtrar por Setor"
          data={sectorOptions}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          radius="md"
          clearable
        />
        <Select
          placeholder="Filtrar por Status"
          data={[
            { value: 'Active', label: 'Ativo' },
            { value: 'Inactive', label: 'Inativo' }
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          radius="md"
          clearable
        />
      </Group>

      {/* 3. TABELA DE COMPONENTES */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>FOTO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME COMPRETO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>MATRÍCULA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>SETOR</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>CARGO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DATA DE ADMISSÃO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((employee, index) => (
                <Table.Tr key={employee.id}>
                  <Table.Td>
                    <Avatar 
                      color={AVATAR_COLORS[index % AVATAR_COLORS.length]} 
                      radius="xl" 
                      size="sm" 
                      fw={700} 
                      style={{ fontSize: '12px' }}
                    >
                      {getInitials(employee.name)}
                    </Avatar>
                  </Table.Td>

                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {employee.name}
                  </Table.Td>

                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {employee.registrationNumber}
                  </Table.Td>

                  <Table.Td fw={700} c="gray.7" style={{ fontSize: '14px' }}>
                    {employee.sectorName || 'N/A'}
                  </Table.Td>

                  <Table.Td c="gray.7" fw={500} style={{ fontSize: '14px' }}>
                    {employee.position || 'N/A'}
                  </Table.Td>

                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {formatDate(employee.admissionDate)}
                  </Table.Td>

                  <Table.Td>
                    {employee.active ? (
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
                        <ActionIcon variant="subtle" color="gray.6" size="sm">
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(employee)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(employee.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum funcionário encontrado.
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