import { 
  Modal, 
  TextInput, 
  Select, 
  Button, 
  Group, 
  Stack 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { showFormApiError } from '../../../utils/apiError';

interface EmployeeOption {
  id: number;
  name: string;
}

interface BuildingOption {
  id: number;
  name: string;
}

interface SectorToEdit {
  id: number;
  name: string;
  buildingId?: number;
  managerId?: number;
}

interface SectorModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sectorToEdit?: SectorToEdit | null;
}

export function SectorModal({
  opened,
  onClose,
  onSuccess,
  sectorToEdit,
}: SectorModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [buildings, setBuildings] = useState<BuildingOption[]>([]);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchOptions = useCallback(async () => {
    try {
      const [empRes, bldRes] = await Promise.all([
        api.get('/employees?size=1000'),
        api.get('/buildings?size=1000'), // Ajuste a rota se a sua for /physical-structure/buildings
      ]);
      setEmployees(extractData(empRes));
      setBuildings(extractData(bldRes));
    } catch (error) {
      console.error('Erro ao carregar opções para o modal de setor:', error);
    }
  }, []);

  const form = useForm({
    initialValues: {
      name: '',
      buildingId: '',
      managerId: '',
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? 'Nome do setor é obrigatório' : null),
      buildingId: (val) => (!val ? 'Selecione o prédio/unidade' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      fetchOptions();

      if (sectorToEdit) {
        form.setValues({
          name: sectorToEdit.name || '',
          buildingId: String(sectorToEdit.buildingId || ''),
          managerId: String(sectorToEdit.managerId || ''),
        });
      } else {
        form.reset();
      }
    }
  }, [opened, sectorToEdit, fetchOptions]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        buildingId: Number(values.buildingId),
        managerId: values.managerId ? Number(values.managerId) : null,
      };

      if (sectorToEdit) {
        await api.put(`/sectors/${sectorToEdit.id}`, payload);
      } else {
        await api.post('/sectors', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      showFormApiError(form, error, 'Erro ao salvar setor.');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeSelectData = employees.map((e) => ({
    value: String(e.id),
    label: e.name,
  }));

  const buildingSelectData = buildings.map((b) => ({
    value: String(b.id),
    label: b.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={sectorToEdit ? 'Editar Setor' : 'Cadastrar Novo Setor'}
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome do Setor"
            placeholder="Ex: T.I, Financeiro, Almoxarifado..."
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Prédio / Unidade"
            placeholder="Selecione o prédio"
            data={buildingSelectData}
            searchable
            clearable
            required
            {...form.getInputProps('buildingId')}
          />

          <Select
            label="Responsável / Gerente (Manager)"
            placeholder="Selecione o funcionário responsável"
            data={employeeSelectData}
            searchable
            clearable
            {...form.getInputProps('managerId')}
          />

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {sectorToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}