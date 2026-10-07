import { 
  Modal, 
  Select, 
  Button, 
  Group, 
  Stack, 
  Textarea, 
  Text,
  Paper
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';

interface AssetOption {
  id: number;
  tagNumber: string;
  name: string;
  sector?: {
    id: number;
    name: string;
  };
}

interface SectorOption {
  id: number;
  name: string;
}

interface MovementModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MovementModal({ opened, onClose, onSuccess }: MovementModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<AssetOption | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchData = useCallback(async () => {
    try {
      const [assetsRes, sectorsRes] = await Promise.all([
        api.get('/assets?size=1000'),
        api.get('/sectors?size=1000')
      ]);
      setAssets(extractData(assetsRes));
      setSectors(extractData(sectorsRes));
    } catch (error) {
      console.error('Erro ao carregar dados para movimentação:', error);
    }
  }, []);

  const form = useForm({
    initialValues: {
      assetId: '',
      destinationSectorId: '',
      reason: '',
    },
    validate: {
      assetId: (val) => (!val ? 'Selecione o bem patrimonial' : null),
      destinationSectorId: (val) => {
        if (!val) return 'Selecione o setor de destino';
        if (selectedAsset?.sector?.id === Number(val)) {
          return 'O setor de destino deve ser diferente da localização atual';
        }
        return null;
      },
    },
  });

  useEffect(() => {
    if (opened) {
      fetchData();
      form.reset();
      setSelectedAsset(null);
    }
  }, [opened, fetchData]);

  const handleAssetChange = (assetId: string | null) => {
    form.setFieldValue('assetId', assetId || '');
    if (assetId) {
      const found = assets.find((a) => String(a.id) === assetId);
      setSelectedAsset(found || null);
    } else {
      setSelectedAsset(null);
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);
      await api.post('/asset-movements', {
        assetId: Number(values.assetId),
        destinationSectorId: Number(values.destinationSectorId),
        reason: values.reason || null,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao realizar movimentação:', error);
      alert(error?.response?.data?.message || 'Erro ao realizar movimentação.');
    } finally {
      setSubmitting(false);
    }
  };

  const assetSelectData = assets.map((a) => ({
    value: String(a.id),
    label: `${a.tagNumber} - ${a.name}`,
  }));

  // O setor de destino não pode ser igual ao setor de origem atual
  const sectorSelectData = sectors
    .filter((s) => s.id !== selectedAsset?.sector?.id)
    .map((s) => ({
      value: String(s.id),
      label: s.name,
    }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nova Movimentação de Patrimônio"
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="Bem Patrimonial (Ativo)"
            placeholder="Busque por TAG ou Nome do Item..."
            data={assetSelectData}
            searchable
            required
            onChange={handleAssetChange}
            value={form.values.assetId}
            error={form.errors.assetId}
          />

          {selectedAsset && (
            <Paper p="xs" radius="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
              <Text size="xs" c="dimmed" fw={700}>LOCALIZAÇÃO ATUAL (ORIGEM)</Text>
              <Text size="sm" fw={600} c="gray.8">
                {selectedAsset.sector?.name || 'Não alocado em setor'}
              </Text>
            </Paper>
          )}

          <Select
            label="Setor de Destino"
            placeholder="Selecione o novo setor..."
            data={sectorSelectData}
            searchable
            required
            disabled={!selectedAsset}
            {...form.getInputProps('destinationSectorId')}
          />

          <Textarea
            label="Motivo / Observação"
            placeholder="Ex: Transferência de setor, envio para manutenção, etc."
            rows={3}
            {...form.getInputProps('reason')}
          />

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              Confirmar Transferência
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}