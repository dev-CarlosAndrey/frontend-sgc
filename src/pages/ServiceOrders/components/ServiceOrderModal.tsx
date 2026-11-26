import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import { showFormApiError } from '../../../utils/apiError';

interface UserOption {
  id: number;
  name: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'USER';
}

interface SectorOption {
  id: number;
  name: string;
}

interface AssetOption {
  id: number;
  tagNumber: string;
  name: string;
}

interface ServiceOrderModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceOrderModal({ opened, onClose, onSuccess }: ServiceOrderModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchOptions = useCallback(async () => {
    try {
      // /users é restrito ao ADMIN; os demais perfis abrem a OS em nome próprio.
      const [usersRes, sectorsRes, assetsRes] = await Promise.all([
        isAdmin ? api.get('/users?size=1000') : Promise.resolve(null),
        api.get('/sectors?size=1000'),
        api.get('/assets?size=1000'),
      ]);
      setUsers(usersRes ? extractData(usersRes) : user ? [{ id: user.userId, name: user.name, role: user.role }] : []);
      setSectors(extractData(sectorsRes));
      setAssets(extractData(assetsRes));
    } catch (error) {
      console.error('Erro ao carregar opções para o modal de ordem de serviço:', error);
    }
  }, [isAdmin, user]);

  const form = useForm({
    initialValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      requesterId: '',
      sectorId: '',
      assetId: '',
    },
    validate: {
      title: (val) => (val.trim().length < 5 ? 'O título deve ter pelo menos 5 caracteres' : null),
      description: (val) => (!val.trim() ? 'A descrição do problema é obrigatória' : null),
      priority: (val) => (!val ? 'A prioridade é obrigatória' : null),
      requesterId: (val) => (!val ? 'O solicitante é obrigatório' : null),
      sectorId: (val) => (!val ? 'O setor é obrigatório' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      fetchOptions();
      form.setValues({
        title: '',
        description: '',
        priority: 'MEDIUM',
        requesterId: user ? String(user.userId) : '',
        sectorId: '',
        assetId: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, fetchOptions]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        requesterId: Number(values.requesterId),
        sectorId: Number(values.sectorId),
        assetId: values.assetId ? Number(values.assetId) : null,
      };

      await api.post('/service-orders', payload);

      onSuccess();
      onClose();
    } catch (error) {
      showFormApiError(form, error, 'Erro ao abrir ordem de serviço.');
    } finally {
      setSubmitting(false);
    }
  };

  const userSelectData = users.map((u) => ({ value: String(u.id), label: u.name }));
  const sectorSelectData = sectors.map((s) => ({ value: String(s.id), label: s.name }));
  const assetSelectData = assets.map((a) => ({ value: String(a.id), label: `${a.tagNumber} - ${a.name}` }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Nova Ordem de Serviço"
      centered
      size="lg"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Título"
            placeholder="Ex: Notebook não liga"
            required
            {...form.getInputProps('title')}
          />

          <Textarea
            label="Descrição do Problema"
            placeholder="Descreva o problema relatado..."
            rows={3}
            required
            {...form.getInputProps('description')}
          />

          <Group grow>
            <Select
              label="Prioridade"
              data={[
                { value: 'LOW', label: 'Baixa' },
                { value: 'MEDIUM', label: 'Média' },
                { value: 'HIGH', label: 'Alta' },
                { value: 'URGENT', label: 'Urgente' },
              ]}
              required
              {...form.getInputProps('priority')}
            />
            <Select
              label="Setor"
              placeholder="Selecione o setor"
              data={sectorSelectData}
              searchable
              required
              {...form.getInputProps('sectorId')}
            />
          </Group>

          <Group grow>
            <Select
              label="Solicitante"
              placeholder="Selecione o solicitante"
              data={userSelectData}
              searchable
              required
              disabled={!isAdmin}
              {...form.getInputProps('requesterId')}
            />
            <Select
              label="Bem Patrimonial (opcional)"
              placeholder="Vincular a um ativo cadastrado"
              data={assetSelectData}
              searchable
              clearable
              {...form.getInputProps('assetId')}
            />
          </Group>

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              Abrir Chamado
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
