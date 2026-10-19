import {
  Grid,
  Paper,
  Text,
  Group,
  Title,
  ThemeIcon,
  Stack,
  Badge,
  Loader,
  Center,
  Select,
  Alert
} from '@mantine/core';
import Chart from 'react-apexcharts';
import {
  IconBox,
  IconAlertCircle,
  IconTrendingDown,
  IconArrowRight,
  IconBuilding,
  IconCoin,
  IconLock
} from '@tabler/icons-react';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

interface CompanyOption {
  id: number;
  companyName?: string;
  name?: string;
}

type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'IN_MAINTENANCE' | 'DISCARDED';

interface DashboardData {
  totalAssets: number;
  activeTickets: number;
  maintenanceCost: number;
  depreciatingAssets: number;
  assetsByStatus?: Partial<Record<AssetStatus, number>>;
  assetsByCompany?: Record<string, number>;
}

const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  IN_MAINTENANCE: 'Em Manutenção',
  DISCARDED: 'Baixado/Inativo',
};

interface RecentMovement {
  id: number;
  assetTagNumber: string;
  assetName: string;
  originSectorName: string;
  destinationSectorName: string;
  movementDate: string;
  reason?: string;
}

export function DashboardScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const [stats, setStats] = useState<DashboardData>({
    totalAssets: 0,
    activeTickets: 0,
    maintenanceCost: 0,
    depreciatingAssets: 0,
  });
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  // Carrega a lista de empresas tratando respostas diretas ou paginadas
  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get('/companies?size=1000');
      const data = res.data?.content || res.data || [];
      if (Array.isArray(data)) {
        setCompanies(data);
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  }, []);

  // Busca os dados do dashboard aplicando o filtro por empresa
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = selectedCompanyId ? `?companyId=${selectedCompanyId}` : '';

      const [dashRes, moveRes] = await Promise.all([
        api.get(`/dashboard${params}`),
        api.get('/asset-movements?page=0&size=5&sort=movementDate,desc'),
      ]);

      if (dashRes.data) {
        setStats({
          totalAssets: dashRes.data.totalAssets ?? 0,
          activeTickets: dashRes.data.activeTickets ?? 0,
          maintenanceCost: dashRes.data.maintenanceCost ?? 0,
          depreciatingAssets: dashRes.data.depreciatingAssets ?? 0,
          assetsByStatus: dashRes.data.assetsByStatus || {},
          assetsByCompany: dashRes.data.assetsByCompany || {},
        });
      }

      setRecentMovements(extractData(moveRes));
    } catch (error) {
      console.error('Erro ao carregar dados do Dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchCompanies();
  }, [fetchCompanies, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchDashboardData();
  }, [fetchDashboardData, isAdmin]);

  const formatDateTime = (isoDate: string) => {
    if (!isoDate) return 'há pouco';
    const date = new Date(isoDate);
    return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Mapeamento das opções do Select utilizando companyName (com fallback para name)
  const companySelectData = companies
    .filter((c) => c && c.id !== undefined && (c.companyName || c.name))
    .map((c) => ({
      value: String(c.id),
      label: String(c.companyName || c.name),
    }));

  // 1. Gráfico de Barras: Bens por Empresa (dado real do dashboard)
  const companyEntries = Object.entries(stats.assetsByCompany || {});
  const barChartOptions: ApexCharts.ApexOptions = {
    chart: { id: 'assets-by-company', toolbar: { show: false } },
    colors: ['#339af0'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: companyEntries.map(([name]) => name) },
    grid: { strokeDashArray: 4 },
  };

  const barChartSeries = [{ name: 'Bens', data: companyEntries.map(([, count]) => count) }];

  // 2. Gráfico de Rosca: Bens por Status (dado real do dashboard)
  const statusEntries = Object.entries(stats.assetsByStatus || {}) as [AssetStatus, number][];
  const donutChartOptions: ApexCharts.ApexOptions = {
    chart: { id: 'assets-by-status' },
    colors: ['#40c057', '#228be6', '#fab005', '#fa5252'],
    labels: statusEntries.map(([status, count]) => `${ASSET_STATUS_LABELS[status] || status} (${count})`),
    legend: { show: true, position: 'bottom', horizontalAlign: 'center', fontSize: '12px' },
    dataLabels: { enabled: false },
  };

  const donutChartSeries = statusEntries.map(([, count]) => count);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!isAdmin) {
    return (
      <Alert
        variant="light"
        color="orange"
        radius="md"
        icon={<IconLock size={18} />}
        title="Acesso restrito"
      >
        O Dashboard é exclusivo para usuários com perfil ADMIN.
      </Alert>
    );
  }

  if (loading && companies.length === 0) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* CABEÇALHO COM SELETOR DE EMPRESA */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Dashboard Geral</Title>
        
        <Select
          placeholder="Todas as Empresas (Visão Geral)"
          leftSection={<IconBuilding size={16} color="gray" />}
          data={companySelectData}
          value={selectedCompanyId}
          onChange={setSelectedCompanyId}
          clearable
          searchable
          radius="md"
          w={320}
        />
      </Group>

      {/* CARDS SUPERIORES DE MÉTRICAS */}
      <Grid>
        {/* Total de Bens */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" c="dimmed" fw={500}>Total de Bens</Text>
                <Text size="xl" fw={700} mt={4}>{stats.totalAssets}</Text>

                {/* Exibe detalhamento por empresa na visão geral */}
                {!selectedCompanyId && stats.assetsByCompany && (
                  <Group gap={4} mt="xs" wrap="wrap">
                    {Object.entries(stats.assetsByCompany).map(([name, count]) => (
                      <Badge key={name} variant="light" color="blue" size="xs" style={{ textTransform: 'none' }}>
                        {name}: {count}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Stack>
              <ThemeIcon color="blue.0" c="blue.6" size="lg" radius="md" style={{ flexShrink: 0 }}>
                <IconBox size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Chamados Ativos */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap={0}>
                <Text size="xs" c="dimmed" fw={500}>Chamados Ativos</Text>
                <Text size="xl" fw={700} mt={4}>{stats.activeTickets}</Text>
              </Stack>
              <ThemeIcon color="orange.0" c="orange.6" size="lg" radius="md">
                <IconAlertCircle size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Custo de Manutenção */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap={0}>
                <Text size="xs" c="dimmed" fw={500}>Custo de Manutenção</Text>
                <Text size="xl" fw={700} mt={4}>{formatCurrency(stats.maintenanceCost)}</Text>
              </Stack>
              <ThemeIcon color="teal.0" c="teal.6" size="lg" radius="md">
                <IconCoin size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Paper>
        </Grid.Col>

        {/* Bens em Depreciação */}
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="flex-start">
              <Stack gap={0}>
                <Text size="xs" c="dimmed" fw={500}>Bens em Depreciação</Text>
                <Text size="xl" fw={700} mt={4}>{stats.depreciatingAssets}</Text>
              </Stack>
              <ThemeIcon color="red.0" c="red.6" size="lg" radius="md">
                <IconTrendingDown size={20} stroke={1.5} />
              </ThemeIcon>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* GRÁFICOS APEXCHARTS */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Text fw={700} size="sm" mb="md">Bens por Empresa</Text>
            {companyEntries.length > 0 ? (
              <Chart options={barChartOptions} series={barChartSeries} type="bar" height={260} />
            ) : (
              <Center h={260}><Text size="sm" c="dimmed">Sem dados suficientes.</Text></Center>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper p="md" radius="md" withBorder h="100%">
            <Text fw={700} size="sm" mb="md">Bens por Status</Text>
            {donutChartSeries.length > 0 ? (
            <Chart options={donutChartOptions} series={donutChartSeries} type="donut" height={280} />
            ) : (
              <Center h={280}><Text size="sm" c="dimmed">Sem dados suficientes.</Text></Center>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* ATIVIDADES RECENTES */}
      <Paper p="md" radius="md" withBorder>
        <Text fw={700} size="sm" mb="md">Movimentações Recentes de Patrimônio</Text>
        <Stack gap="md">
          {recentMovements.length > 0 ? (
            recentMovements.map((movement) => (
              <Group 
                key={movement.id} 
                align="center" 
                justify="space-between" 
                wrap="nowrap" 
                style={{ borderBottom: '1px solid #f1f3f5', paddingBottom: 12 }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Badge color="blue" size="xs" circle mt={2} />
                  <Stack gap={2}>
                    <Text size="sm">
                      <strong>{movement.assetTagNumber}</strong> ({movement.assetName}) foi transferido de{' '}
                      <strong>{movement.originSectorName}</strong> para{' '}
                      <Text span c="blue.6" fw={700}>{movement.destinationSectorName}</Text>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDateTime(movement.movementDate)} {movement.reason ? `• ${movement.reason}` : ''}
                    </Text>
                  </Stack>
                </Group>
                <IconArrowRight size={16} color="#adb5bd" />
              </Group>
            ))
          ) : (
            <Text size="sm" c="dimmed" style={{ textAlign: 'center', padding: '12px 0' }}>
              Nenhuma movimentação realizada recentemente.
            </Text>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}