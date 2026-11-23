import { Modal, Text, Group, Stack, Badge, Image, Center, Divider, SimpleGrid, Paper } from '@mantine/core';
import { IconPhotoOff } from '@tabler/icons-react';

type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'IN_MAINTENANCE' | 'DISCARDED';
type ConservationState = 'NEW' | 'GOOD' | 'REGULAR' | 'BAD' | 'UNSERVICEABLE';

export interface AssetDetails {
  id: number;
  tagNumber: string;
  name: string;
  description?: string;
  model?: string;
  serialNumber?: string;
  status: AssetStatus;
  sector?: { id: number; name: string };
  category?: { id: number; name: string } | null;
  responsible?: { id: number; name: string } | null;
  acquisitionDate?: string | null;
  acquisitionValue?: number | null;
  conservationState?: ConservationState | null;
  photoUrl?: string | null;
  createdAt?: string;
}

interface AssetDetailsModalProps {
  asset: AssetDetails | null;
  photoSrc?: string;
  onClose: () => void;
}

const STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  IN_MAINTENANCE: 'Em Manutenção',
  DISCARDED: 'Baixado/Inativo',
};

const STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: 'green',
  IN_USE: 'blue',
  IN_MAINTENANCE: 'orange',
  DISCARDED: 'red',
};

const CONSERVATION_LABELS: Record<ConservationState, string> = {
  NEW: 'Novo',
  GOOD: 'Bom',
  REGULAR: 'Regular',
  BAD: 'Ruim',
  UNSERVICEABLE: 'Inservível',
};

// acquisitionDate é LocalDate ("2025-01-10"): formata sem passar por Date para não deslocar o dia pelo fuso
const formatLocalDate = (value?: string | null) => {
  if (!value) return undefined;
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase">{label}</Text>
      <Text size="sm" fw={500}>{value || '-'}</Text>
    </div>
  );
}

export function AssetDetailsModal({ asset, photoSrc, onClose }: AssetDetailsModalProps) {
  return (
    <Modal
      opened={asset !== null}
      onClose={onClose}
      title={<Text fw={700} size="lg">Detalhes do Bem Patrimonial</Text>}
      size="xl"
      radius="md"
      centered
    >
      {asset && (
        <Stack gap="md">
          <Group align="flex-start" gap="lg" wrap="wrap">
            <Paper withBorder radius="md" w={180} h={180} style={{ overflow: 'hidden', flexShrink: 0 }}>
              {photoSrc ? (
                <Image src={photoSrc} alt={asset.name} w={180} h={180} fit="cover" />
              ) : (
                <Center h="100%" c="dimmed">
                  <Stack gap={4} align="center">
                    <IconPhotoOff size={32} />
                    <Text size="xs">Sem foto</Text>
                  </Stack>
                </Center>
              )}
            </Paper>

            <Stack gap={6} style={{ flex: 1, minWidth: 220 }}>
              <Text size="xs" c="dimmed" fw={600}>TOMBAMENTO {asset.tagNumber}</Text>
              <Text fw={700} size="xl">{asset.name}</Text>
              <Group gap="xs">
                <Badge variant="light" color={STATUS_COLORS[asset.status]} radius="md" style={{ textTransform: 'none' }}>
                  {STATUS_LABELS[asset.status]}
                </Badge>
                {asset.conservationState && (
                  <Badge variant="outline" color="gray" radius="md" style={{ textTransform: 'none' }}>
                    Conservação: {CONSERVATION_LABELS[asset.conservationState]}
                  </Badge>
                )}
              </Group>
              {asset.description && (
                <Text size="sm" c="gray.7" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>{asset.description}</Text>
              )}
            </Stack>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Field label="Modelo" value={asset.model} />
            <Field label="Nº de Série" value={asset.serialNumber} />
            <Field label="Categoria" value={asset.category?.name} />
            <Field label="Localização / Setor" value={asset.sector?.name || 'Não alocado'} />
            <Field label="Responsável" value={asset.responsible?.name} />
            <Field label="Data de Aquisição" value={formatLocalDate(asset.acquisitionDate)} />
            <Field
              label="Valor de Aquisição"
              value={
                asset.acquisitionValue != null
                  ? asset.acquisitionValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                  : undefined
              }
            />
            <Field
              label="Cadastrado em"
              value={asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('pt-BR') : undefined}
            />
          </SimpleGrid>
        </Stack>
      )}
    </Modal>
  );
}
