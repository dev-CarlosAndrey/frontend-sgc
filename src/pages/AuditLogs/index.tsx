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
  Pagination,
  Select,
  Text
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

interface AuditLog {
  id: number;
  entityName: string;
  entityId: number;
  action: string;
  performedBy: string;
  details: string;
  createdAt: string;
}

const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  ASSIGN_TECHNICIAN: 'orange',
  RESOLVE: 'teal',
};

export function AuditLogsScreen() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) {
      return { content: response.data, totalPages: 1, totalElements: response.data.length };
    }
    if (response.data?.content && Array.isArray(response.data.content)) {
      // Spring Data recente aninha os totais em `page`; versões antigas os deixam na raiz
      const meta = response.data.page ?? response.data;
      return {
        content: response.data.content,
        totalPages: meta.totalPages ?? 1,
        totalElements: meta.totalElements ?? response.data.content.length,
      };
    }
    return { content: [], totalPages: 1, totalElements: 0 };
  };

  const fetchLogs = useCallback(async (currentPage: number, size: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/audit-logs?page=${currentPage - 1}&size=${size}&sort=createdAt,desc`);
      const { content, totalPages, totalElements } = extractData(response);
      setLogs(content);
      setTotalPages(Math.max(totalPages, 1));
      setTotalElements(totalElements);
    } catch (error) {
      console.error('Erro ao buscar log de auditoria:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, pageSize);
  }, [fetchLogs, page, pageSize]);

  const handlePageSizeChange = (value: string | null) => {
    if (!value) return;
    setPageSize(Number(value));
    setPage(1);
  };

  const filteredLogs = logs.filter((log) =>
    log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDateTime = (isoDate: string) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading && logs.length === 0) {
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
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
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

        <Group justify="space-between" p="md">
          <Group gap="sm">
            <Text size="sm" c="dimmed">Por página:</Text>
            <Select
              data={PAGE_SIZE_OPTIONS}
              value={String(pageSize)}
              onChange={handlePageSizeChange}
              allowDeselect={false}
              disabled={loading}
              w={80}
              size="xs"
              radius="md"
            />
            <Text size="sm" c="dimmed">
              {totalElements} registro(s) — página {page} de {totalPages}
            </Text>
          </Group>
          {totalPages > 1 && (
            <Pagination value={page} onChange={setPage} total={totalPages} disabled={loading} radius="md" />
          )}
        </Group>
      </Paper>
    </Stack>
  );
}
