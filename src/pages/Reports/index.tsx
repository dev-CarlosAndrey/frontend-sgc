// src/pages/Reports/index.tsx
import { Alert, Paper, Stack, Tabs, Text, Title } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  AssetsPanel,
  AuditPanel,
  CriticalAssetsPanel,
  MaintenanceCostPanel,
  MonthlyPanel,
  MovementsPanel,
  PatrimonyPanel,
  ServiceOrdersPanel,
  StageTimesPanel,
} from './components/panels';
import type { Option } from './components/panels';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractList = (response: any) => {
  if (Array.isArray(response.data)) return response.data;
  if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
  return [];
};

export function ReportsScreen() {
  const [companies, setCompanies] = useState<Option[]>([]);
  const [technicians, setTechnicians] = useState<Option[]>([]);

  useEffect(() => {
    api
      .get('/companies?size=1000')
      .then((res) =>
        setCompanies(extractList(res).map((c: { id: number; companyName: string }) => ({ value: String(c.id), label: c.companyName })))
      )
      .catch((err) => console.error('Erro ao buscar empresas:', err));
    api
      .get('/users?size=1000')
      .then((res) =>
        setTechnicians(
          extractList(res)
            .filter((u: { role: string }) => u.role === 'TECHNICIAN')
            .map((u: { id: number; name: string }) => ({ value: String(u.id), label: u.name }))
        )
      )
      .catch((err) => console.error('Erro ao buscar técnicos:', err));
  }, []);

  return (
    <Stack gap="md">
      <div>
        <Title order={2} fw={700} style={{ fontSize: '24px' }}>Central de Relatórios</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Consulte indicadores de bens, ordens de serviço, movimentações e auditoria, e exporte em CSV ou PDF
        </Text>
      </div>

      <Paper p="lg" radius="md" withBorder>
        <Tabs defaultValue="assets" keepMounted={false}>
          <Tabs.List mb="lg" style={{ flexWrap: 'wrap' }}>
            <Tabs.Tab value="assets">Bens</Tabs.Tab>
            <Tabs.Tab value="patrimony">Patrimônio</Tabs.Tab>
            <Tabs.Tab value="critical">Bens críticos</Tabs.Tab>
            <Tabs.Tab value="orders">Ordens de serviço</Tabs.Tab>
            <Tabs.Tab value="monthly">Evolução mensal</Tabs.Tab>
            <Tabs.Tab value="stages">Tempo por etapa</Tabs.Tab>
            <Tabs.Tab value="cost">Custo de manutenção</Tabs.Tab>
            <Tabs.Tab value="movements">Movimentações</Tabs.Tab>
            <Tabs.Tab value="audit">Auditoria</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="assets"><AssetsPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="patrimony"><PatrimonyPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="critical"><CriticalAssetsPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="orders"><ServiceOrdersPanel companies={companies} technicians={technicians} /></Tabs.Panel>
          <Tabs.Panel value="monthly"><MonthlyPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="stages"><StageTimesPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="cost"><MaintenanceCostPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="movements"><MovementsPanel companies={companies} /></Tabs.Panel>
          <Tabs.Panel value="audit"><AuditPanel /></Tabs.Panel>
        </Tabs>
      </Paper>

      <Alert variant="light" color="blue" radius="md" icon={<IconInfoCircle size={18} />}>
        Os relatórios estão disponíveis em tela, em CSV (compatível com Excel) e em PDF. O PDF é gerado na hora
        e não fica guardado em lugar nenhum — para ter o arquivo de novo, basta exportar outra vez.
      </Alert>
    </Stack>
  );
}
