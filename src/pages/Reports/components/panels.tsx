import { Badge, Group, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { DateInputBR } from '../../../components/DateInputBR';
import { DataTable, ReportPanel, Stat, StatGrid } from './ReportPanel';
import { buildQuery, formatCurrency, formatHours } from '../utils';

export interface Option {
  value: string;
  label: string;
}

interface CommonProps {
  companies: Option[];
}

const ASSET_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  IN_MAINTENANCE: 'Em Manutenção',
  DISCARDED: 'Baixado',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em Andamento',
  RESOLVED: 'Finalizada',
  CANCELLED: 'Cancelada',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

const CONSERVATION_LABELS: Record<string, string> = {
  NEW: 'Novo',
  GOOD: 'Bom',
  REGULAR: 'Regular',
  BAD: 'Ruim',
  UNSERVICEABLE: 'Inservível',
};

const CRITICAL_REASON_LABELS: Record<string, string> = {
  BAD_CONSERVATION: 'Conservação ruim',
  RECURRENT_MAINTENANCE: 'Manutenção recorrente',
};

const invalidRange = (from: string, to: string) =>
  from && to && from > to ? 'A data inicial não pode ser posterior à data final.' : null;

interface DateRangeProps {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
}

function DateRange({ from, to, setFrom, setTo }: DateRangeProps) {
  return (
    <>
      <DateInputBR label="De" value={from || null} onChange={(v) => setFrom(v ?? '')} clearable radius="md" />
      <DateInputBR label="Até" value={to || null} onChange={(v) => setTo(v ?? '')} clearable radius="md" />
    </>
  );
}

function CompanySelect({ companies, value, onChange }: CommonProps & { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <Select label="Empresa" placeholder="Todas" data={companies} value={value} onChange={onChange} radius="md" clearable w={240} />
  );
}

const labelOf = (map: Record<string, string>, key: string) => map[key] ?? key;

// ---------- Bens por categoria e situação ----------

interface AssetsReport {
  total: number;
  byStatus: { key: string; total: number }[];
  byCategory: { categoryId: number | null; categoryName: string; total: number; byStatus: Record<string, number> }[];
}

export function AssetsPanel({ companies }: CommonProps) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const statusKeys = Object.keys(ASSET_STATUS_LABELS);

  return (
    <ReportPanel<AssetsReport>
      path="/reports/assets"
      query={buildQuery({ companyId })}
      exportName="bens-por-categoria.csv"
      filters={<CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />}
    >
      {(data) => (
        <Stack gap="md">
          <StatGrid>
            <Stat label="Total" value={data.total} />
            {data.byStatus.map((s) => (
              <Stat key={s.key} label={labelOf(ASSET_STATUS_LABELS, s.key)} value={s.total} />
            ))}
          </StatGrid>
          <DataTable
            headers={['Categoria', ...statusKeys.map((k) => ASSET_STATUS_LABELS[k]), 'Total']}
            rows={data.byCategory.map((c) => [
              c.categoryName,
              ...statusKeys.map((k) => c.byStatus[k] ?? 0),
              <Text fw={700} size="sm">{c.total}</Text>,
            ])}
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Ordens de serviço ----------

interface OrdersReport {
  total: number;
  resolved: number;
  totalCost: number;
  avgResolutionHours: number | null;
  byStatus: { key: string; total: number }[];
  byPriority: { key: string; total: number }[];
  byTechnician: { technicianId: number | null; technicianName: string; total: number; resolved: number; avgResolutionHours: number | null }[];
  topAssets: { assetId: number; tagNumber: string; name: string; total: number }[];
}

export function ServiceOrdersPanel({ companies, technicians }: CommonProps & { technicians: Option[] }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [field, setField] = useState('OPENED');
  const [status, setStatus] = useState<string | null>(null);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<OrdersReport>
      path="/reports/service-orders"
      query={buildQuery({ from, to, field, status, technicianId, companyId })}
      exportName="ordens-de-servico.csv"
      validate={() => invalidRange(from, to)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <Select
            label="Período se aplica a"
            data={[{ value: 'OPENED', label: 'Data de abertura' }, { value: 'CLOSED', label: 'Data de conclusão' }]}
            value={field}
            onChange={(v) => setField(v ?? 'OPENED')}
            allowDeselect={false}
            radius="md"
          />
          <Select
            label="Status"
            placeholder="Todos"
            data={Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            value={status}
            onChange={setStatus}
            radius="md"
            clearable
          />
          <Select label="Técnico" placeholder="Todos" data={technicians} value={technicianId} onChange={setTechnicianId} radius="md" clearable />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <StatGrid>
            <Stat label="Total de OS" value={data.total} />
            <Stat label="Finalizadas" value={data.resolved} />
            <Stat label="Custo total" value={formatCurrency(data.totalCost ?? 0)} />
            <Stat label="Tempo médio de resolução" value={formatHours(data.avgResolutionHours)} />
          </StatGrid>
          <Group gap="xs">
            {data.byStatus.map((i) => (
              <Badge key={i.key} variant="light" size="lg" radius="sm" style={{ textTransform: 'none' }}>
                {labelOf(ORDER_STATUS_LABELS, i.key)}: {i.total}
              </Badge>
            ))}
            {data.byPriority.map((i) => (
              <Badge key={i.key} variant="outline" color="gray" size="lg" radius="sm" style={{ textTransform: 'none' }}>
                {labelOf(PRIORITY_LABELS, i.key)}: {i.total}
              </Badge>
            ))}
          </Group>
          <DataTable
            headers={['Técnico', 'OS', 'Finalizadas', 'Tempo médio']}
            rows={data.byTechnician.map((t) => [t.technicianName, t.total, t.resolved, formatHours(t.avgResolutionHours)])}
          />
          <DataTable
            headers={['Bens com mais manutenções', 'Tombamento', 'OS']}
            rows={data.topAssets.map((a) => [a.name, a.tagNumber, a.total])}
            emptyText="Sem bens vinculados no filtro."
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Custo de manutenção x valor de aquisição ----------

interface MaintenanceCostReport {
  thresholdPercent: number;
  totalMaintenanceCost: number;
  totalAcquisitionValue: number;
  assetsAboveThreshold: number;
  assets: {
    assetId: number;
    tagNumber: string;
    name: string;
    categoryName: string;
    acquisitionValue: number | null;
    orders: number;
    maintenanceCost: number;
    costPercentOfValue: number | null;
    exceedsThreshold: boolean;
  }[];
}

export function MaintenanceCostPanel({ companies }: CommonProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [field, setField] = useState('CLOSED');
  const [threshold, setThreshold] = useState<number | string>(50);
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<MaintenanceCostReport>
      path="/reports/maintenance-cost"
      query={buildQuery({ from, to, field, threshold, companyId })}
      exportName="custo-manutencao-por-bem.csv"
      validate={() => invalidRange(from, to) ?? (Number(threshold) < 0 ? 'O limite (%) não pode ser negativo.' : null)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <Select
            label="Período se aplica a"
            data={[{ value: 'CLOSED', label: 'Data de conclusão' }, { value: 'OPENED', label: 'Data de abertura' }]}
            value={field}
            onChange={(v) => setField(v ?? 'CLOSED')}
            allowDeselect={false}
            radius="md"
          />
          <NumberInput label="Limite (% do valor)" min={0} value={threshold} onChange={setThreshold} radius="md" w={140} />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <StatGrid>
            <Stat label="Custo total de manutenção" value={formatCurrency(data.totalMaintenanceCost)} />
            <Stat label="Valor de aquisição (listados)" value={formatCurrency(data.totalAcquisitionValue)} />
            <Stat label={`Bens acima de ${data.thresholdPercent}%`} value={data.assetsAboveThreshold} />
          </StatGrid>
          <DataTable
            headers={['Bem', 'Tombamento', 'Categoria', 'Valor de aquisição', 'OS', 'Custo de manutenção', '% do valor', 'Situação']}
            rows={data.assets.map((a) => [
              a.name,
              a.tagNumber,
              a.categoryName,
              formatCurrency(a.acquisitionValue),
              a.orders,
              formatCurrency(a.maintenanceCost),
              a.costPercentOfValue != null ? `${a.costPercentOfValue}%` : '-',
              a.exceedsThreshold ? (
                <Badge color="red" variant="light" radius="sm">Candidato a baixa</Badge>
              ) : (
                <Badge color="gray" variant="light" radius="sm">Ok</Badge>
              ),
            ])}
            emptyText="Nenhum bem com OS finalizada e custo informado no filtro."
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Evolução mensal ----------

interface MonthlyReport {
  totalOpened: number;
  totalResolved: number;
  months: { month: string; opened: number; resolved: number; cost: number }[];
}

const formatMonth = (value: string) => {
  const [year, month] = value.split('-');
  return `${month}/${year}`;
};

export function MonthlyPanel({ companies }: CommonProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<MonthlyReport>
      path="/reports/service-orders/monthly"
      query={buildQuery({ from, to, companyId })}
      exportName="os-por-mes.csv"
      validate={() => invalidRange(from, to)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <Text size="sm" c="dimmed">Sem datas, mostra os últimos 12 meses (máximo de 60 meses).</Text>
          <StatGrid>
            <Stat label="Abertas no período" value={data.totalOpened} />
            <Stat label="Concluídas no período" value={data.totalResolved} />
          </StatGrid>
          <DataTable
            headers={['Mês', 'Abertas', 'Concluídas', 'Custo']}
            rows={data.months.map((m) => [formatMonth(m.month), m.opened, m.resolved, formatCurrency(m.cost)])}
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Tempo por etapa ----------

interface StageTimesReport {
  orders: number;
  bottleneck: string | null;
  stages: { status: string; samples: number; avgHours: number; maxHours: number }[];
  byPriority: { priority: string; orders: number; avgFirstResponseHours: number | null; avgResolutionHours: number | null }[];
}

export function StageTimesPanel({ companies }: CommonProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<StageTimesReport>
      path="/reports/service-orders/stage-times"
      query={buildQuery({ from, to, companyId })}
      exportName="tempo-por-etapa.csv"
      validate={() => invalidRange(from, to)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <StatGrid>
            <Stat label="OS analisadas" value={data.orders} />
            <Stat label="Gargalo" value={data.bottleneck ? labelOf(ORDER_STATUS_LABELS, data.bottleneck) : '-'} />
          </StatGrid>
          <DataTable
            headers={['Etapa', 'Amostras', 'Tempo médio', 'Tempo máximo']}
            rows={data.stages.map((s) => [labelOf(ORDER_STATUS_LABELS, s.status), s.samples, formatHours(s.avgHours), formatHours(s.maxHours)])}
            emptyText="Sem passagens encerradas no filtro."
          />
          <DataTable
            headers={['Prioridade', 'OS', 'Primeira resposta (média)', 'Resolução (média)']}
            rows={data.byPriority.map((p) => [
              labelOf(PRIORITY_LABELS, p.priority),
              p.orders,
              formatHours(p.avgFirstResponseHours),
              formatHours(p.avgResolutionHours),
            ])}
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Patrimônio e depreciação ----------

interface PatrimonyGroup {
  groupId: number | null;
  groupName: string;
  assets: number;
  assetsWithoutValuation: number;
  acquisitionValue: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

interface PatrimonyReport {
  asOf: string;
  usefulLifeYears: number;
  assets: number;
  assetsWithoutValuation: number;
  acquisitionValue: number;
  accumulatedDepreciation: number;
  bookValue: number;
  groups: PatrimonyGroup[];
}

export function PatrimonyPanel({ companies }: CommonProps) {
  const [groupBy, setGroupBy] = useState('CATEGORY');
  const [usefulLifeYears, setUsefulLifeYears] = useState<number | string>(10);
  const [asOf, setAsOf] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<PatrimonyReport>
      path="/reports/assets/patrimony"
      query={buildQuery({ groupBy, usefulLifeYears, asOf, companyId })}
      exportName="patrimonio.csv"
      validate={() => {
        const years = Number(usefulLifeYears);
        return years >= 1 && years <= 50 ? null : 'A vida útil deve estar entre 1 e 50 anos.';
      }}
      filters={
        <>
          <Select
            label="Agrupar por"
            data={[{ value: 'CATEGORY', label: 'Categoria' }, { value: 'SECTOR', label: 'Setor' }]}
            value={groupBy}
            onChange={(v) => setGroupBy(v ?? 'CATEGORY')}
            allowDeselect={false}
            radius="md"
            w={160}
          />
          <NumberInput label="Vida útil (anos)" min={1} max={50} value={usefulLifeYears} onChange={setUsefulLifeYears} radius="md" w={140} />
          <DateInputBR label="Data de referência" value={asOf || null} onChange={(v) => setAsOf(v ?? '')} clearable radius="md" />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Depreciação linear, sem valor residual, por meses completos, com a mesma vida útil ({data.usefulLifeYears} anos) para todos os
            bens. Referência: {new Date(`${data.asOf}T00:00:00`).toLocaleDateString('pt-BR')}. Bens baixados ficam de fora.
          </Text>
          <StatGrid>
            <Stat label="Valor de aquisição" value={formatCurrency(data.acquisitionValue)} />
            <Stat label="Depreciação acumulada" value={formatCurrency(data.accumulatedDepreciation)} />
            <Stat label="Valor contábil" value={formatCurrency(data.bookValue)} />
            <Stat label="Bens sem valoração" value={`${data.assetsWithoutValuation} de ${data.assets}`} />
          </StatGrid>
          <DataTable
            headers={[groupBy === 'SECTOR' ? 'Setor' : 'Categoria', 'Bens', 'Sem valoração', 'Aquisição', 'Depreciação', 'Valor contábil']}
            rows={data.groups.map((g) => [
              g.groupName,
              g.assets,
              g.assetsWithoutValuation,
              formatCurrency(g.acquisitionValue),
              formatCurrency(g.accumulatedDepreciation),
              formatCurrency(g.bookValue),
            ])}
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Bens críticos ----------

interface CriticalReport {
  minOrders: number;
  total: number;
  assets: {
    assetId: number;
    tagNumber: string;
    name: string;
    sectorName: string;
    categoryName: string;
    conservationState: string | null;
    orders: number;
    maintenanceCost: number;
    reasons: string[];
  }[];
}

export function CriticalAssetsPanel({ companies }: CommonProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minOrders, setMinOrders] = useState<number | string>(2);
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<CriticalReport>
      path="/reports/assets/critical"
      query={buildQuery({ from, to, minOrders, companyId })}
      exportName="bens-criticos.csv"
      validate={() => invalidRange(from, to) ?? (Number(minOrders) >= 1 ? null : 'O mínimo de OS deve ser 1 ou mais.')}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <NumberInput label="Mínimo de OS" min={1} value={minOrders} onChange={setMinOrders} radius="md" w={130} />
          <CompanySelect companies={companies} value={companyId} onChange={setCompanyId} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <StatGrid>
            <Stat label="Bens críticos" value={data.total} />
          </StatGrid>
          <DataTable
            headers={['Bem', 'Tombamento', 'Setor', 'Categoria', 'Conservação', 'OS', 'Custo', 'Motivos']}
            rows={data.assets.map((a) => [
              a.name,
              a.tagNumber,
              a.sectorName,
              a.categoryName,
              a.conservationState ? labelOf(CONSERVATION_LABELS, a.conservationState) : '-',
              a.orders,
              formatCurrency(a.maintenanceCost),
              <Group gap={4} justify="center">
                {a.reasons.map((r) => (
                  <Badge key={r} color="orange" variant="light" radius="sm" style={{ textTransform: 'none' }}>
                    {labelOf(CRITICAL_REASON_LABELS, r)}
                  </Badge>
                ))}
              </Group>,
            ])}
            emptyText="Nenhum bem crítico encontrado."
          />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Movimentações ----------

interface MovementsReport {
  total: number;
  distinctAssets: number;
  topAssets: { assetId: number; tagNumber: string; name: string; total: number }[];
  byOriginSector: { key: string; total: number }[];
  byDestinationSector: { key: string; total: number }[];
}

export function MovementsPanel({ companies }: CommonProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  return (
    <ReportPanel<MovementsReport>
      path="/reports/movements"
      query={buildQuery({ from, to, companyId })}
      exportName="movimentacoes.csv"
      validate={() => invalidRange(from, to)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <Select label="Empresa (setor de destino)" placeholder="Todas" data={companies} value={companyId} onChange={setCompanyId} radius="md" clearable w={240} />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <Text size="sm" c="dimmed">A lista completa das movimentações (data, bem, origem, destino, motivo) está no CSV.</Text>
          <StatGrid>
            <Stat label="Movimentações" value={data.total} />
            <Stat label="Bens distintos" value={data.distinctAssets} />
          </StatGrid>
          <DataTable
            headers={['Bens mais movimentados', 'Tombamento', 'Movimentações']}
            rows={data.topAssets.map((a) => [a.name, a.tagNumber, a.total])}
          />
          <DataTable headers={['Setor de origem', 'Movimentações']} rows={data.byOriginSector.map((s) => [s.key, s.total])} />
          <DataTable headers={['Setor de destino', 'Movimentações']} rows={data.byDestinationSector.map((s) => [s.key, s.total])} />
        </Stack>
      )}
    </ReportPanel>
  );
}

// ---------- Auditoria ----------

interface AuditReport {
  total: number;
  byEntity: { key: string; total: number }[];
  byAction: { key: string; total: number }[];
  byUser: { key: string; total: number }[];
}

export function AuditPanel() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [entityName, setEntityName] = useState('');
  const [performedBy, setPerformedBy] = useState('');

  return (
    <ReportPanel<AuditReport>
      path="/reports/audit"
      query={buildQuery({ from, to, entityName: entityName.trim(), performedBy: performedBy.trim() })}
      exportName="auditoria.csv"
      validate={() => invalidRange(from, to)}
      filters={
        <>
          <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} />
          <TextInput label="Entidade" placeholder="Ex.: Asset" value={entityName} onChange={(e) => setEntityName(e.currentTarget.value)} radius="md" />
          <TextInput label="Responsável" placeholder="Login exato" value={performedBy} onChange={(e) => setPerformedBy(e.currentTarget.value)} radius="md" />
        </>
      }
    >
      {(data) => (
        <Stack gap="md">
          <Text size="sm" c="dimmed">O CSV traz os 10.000 eventos mais recentes do filtro.</Text>
          <StatGrid>
            <Stat label="Eventos" value={data.total} />
          </StatGrid>
          <DataTable headers={['Entidade', 'Eventos']} rows={data.byEntity.map((i) => [i.key, i.total])} />
          <DataTable headers={['Ação', 'Eventos']} rows={data.byAction.map((i) => [i.key, i.total])} />
          <DataTable headers={['Usuário', 'Eventos']} rows={data.byUser.map((i) => [i.key, i.total])} />
        </Stack>
      )}
    </ReportPanel>
  );
}
