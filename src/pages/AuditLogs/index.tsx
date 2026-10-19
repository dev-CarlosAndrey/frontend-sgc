import {
  Title,
  Paper,
  Group,
  TextInput,
  Table,
  Badge,
  Stack,
  Loader,
  Center,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';

interface AuditLog {
  id: number;
  entityName: string;
  entityId: number;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  ASSIGN_TECHNICIAN: 'orange',
  RESOLVE: 'teal',
};

export function AuditLogsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação e busca feitas no backend (mais recentes primeiro)
  const pagination = useServerPagination<AuditLog>('/audit-logs', { q: debouncedSearch }, { sort: 'createdAt,desc' });

  const formatDateTime = (isoDate: string) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
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
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Log de Auditoria</Title>
      </Group>

      <div style={{ maxWidth: '400px' }}>
        <TextInput
          placeholder="Buscar por entidade, ação ou responsável..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
        />
      </div>

      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="sm" horizontalSpacing="lg" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DATA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ENTIDADE</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>AÇÃO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>RESPONSÁVEL</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>DETALHES</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.createdAt)}
                  </Table.Td>
                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {log.entityName} #{log.entityId}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light" color={ACTION_COLORS[log.action] || 'gray'} radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                      {log.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td c="gray.7" fw={500} style={{ fontSize: '14px' }}>
                    {log.performedBy}
                  </Table.Td>
                  <Table.Td c="gray.6" style={{ fontSize: '13px' }}>
                    {log.details}
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum registro de auditoria encontrado.
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
