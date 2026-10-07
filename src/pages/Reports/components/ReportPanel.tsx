import { Alert, Button, Center, Group, Loader, Paper, SimpleGrid, Stack, Table, Text } from '@mantine/core';
import { IconDownload, IconFileTypePdf } from '@tabler/icons-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../../services/api';

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Paper p="sm" withBorder radius="md">
      <Text size="xs" c="dimmed" fw={700}>{label.toUpperCase()}</Text>
      <Text fw={700} size="xl">{value}</Text>
    </Paper>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <SimpleGrid cols={{ base: 2, md: 4 }}>{children}</SimpleGrid>;
}

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyText?: string;
}

// Tabela simples: primeira coluna alinhada à esquerda, demais centralizadas
export function DataTable({ headers, rows, emptyText = 'Nenhum registro encontrado.' }: DataTableProps) {
  return (
    <Paper radius="md" withBorder style={{ overflow: 'auto' }}>
      <Table verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
          <Table.Tr>
            {headers.map((header, i) => (
              <Table.Th key={header} c="dimmed" fw={700} style={{ fontSize: '11px', textAlign: i === 0 ? 'left' : 'center' }}>
                {header.toUpperCase()}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows.map((row, r) => (
              <Table.Tr key={r}>
                {row.map((cell, i) => (
                  <Table.Td key={i} fw={i === 0 ? 600 : undefined} style={{ textAlign: i === 0 ? 'left' : 'center' }}>
                    {cell}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={headers.length} style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">{emptyText}</Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Paper>
  );
}

interface ReportPanelProps<T> {
  path: string;
  query: string;
  exportName: string;
  filters: ReactNode;
  // Retorna a mensagem de erro caso os filtros sejam inválidos
  validate?: () => string | null;
  children: (data: T) => ReactNode;
}

export function ReportPanel<T>({ path, query, exportName, filters, validate, children }: ReportPanelProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = () => {
    const message = validate?.() ?? null;
    setError(message);
    return message === null;
  };

  const generate = async () => {
    if (!check()) return;
    try {
      setLoading(true);
      const res = await api.get(`${path}${query}`);
      setData(res.data);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError('Não foi possível gerar o relatório. Verifique os filtros e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // O CSV exige o header Authorization, então baixamos como blob em vez de usar <a href>
  const exportCsv = async () => {
    if (!check()) return;
    try {
      setDownloading(true);
      const res = await api.get(`${path}/export${query}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
      setError('Não foi possível baixar o arquivo CSV.');
    } finally {
      setDownloading(false);
    }
  };

  // O backend gera o PDF na hora e não guarda em lugar nenhum — cada clique baixa um arquivo novo.
  const exportPdf = async () => {
    if (!check()) return;
    try {
      setDownloadingPdf(true);
      const res = await api.get(`${path}/export/pdf${query}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = exportName.replace(/\.csv$/, '.pdf');
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      setError('Não foi possível baixar o arquivo PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Stack gap="md">
      <Group align="end">
        {filters}
        <Button radius="md" loading={loading} onClick={generate}>Gerar relatório</Button>
        <Button
          radius="md"
          variant="light"
          leftSection={<IconDownload size={16} />}
          loading={downloading}
          onClick={exportCsv}
        >
          Exportar CSV
        </Button>
        <Button
          radius="md"
          variant="light"
          color="red"
          leftSection={<IconFileTypePdf size={16} />}
          loading={downloadingPdf}
          onClick={exportPdf}
        >
          Exportar PDF
        </Button>
      </Group>

      {error && (
        <Alert color="red" variant="light" radius="md" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && <Center p="md"><Loader size="sm" /></Center>}
      {data && !loading && children(data)}
    </Stack>
  );
}
