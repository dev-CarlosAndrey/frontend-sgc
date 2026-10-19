import { Modal, TextInput, Group, Button, Text, Select, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { showFormApiError } from '../../../utils/apiError';

interface CompanyOption {
  id: number;
  companyName: string;
}

interface BuildingData {
  id?: number;
  name: string;
  address: string;
  companyId: number;
}

interface BuildingModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companies: CompanyOption[];
  buildingToEdit?: BuildingData | null;
  defaultCompanyId?: number | null;
}

export function BuildingModal({
  opened,
  onClose,
  onSuccess,
  companies,
  buildingToEdit,
  defaultCompanyId,
}: BuildingModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      address: '',
      companyId: defaultCompanyId ? String(defaultCompanyId) : '',
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? 'Informe o nome do prédio' : null),
      address: (val) => (val.trim().length < 5 ? 'Informe o endereço/referência' : null),
      companyId: (val) => (!val ? 'Selecione uma empresa' : null),
    },
  });

  useEffect(() => {
    if (buildingToEdit) {
      form.setValues({
        name: buildingToEdit.name,
        address: buildingToEdit.address,
        companyId: String(buildingToEdit.companyId),
      });
    } else {
      form.reset();
      if (defaultCompanyId) {
        form.setFieldValue('companyId', String(defaultCompanyId));
      }
    }
  }, [buildingToEdit, defaultCompanyId, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      const payload = {
        name: values.name.trim(),
        address: values.address.trim(),
        companyId: Number(values.companyId),
      };

      if (buildingToEdit?.id) {
        await api.put(`/buildings/${buildingToEdit.id}`, payload);
      } else {
        await api.post('/buildings', payload);
      }

      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      showFormApiError(form, error, 'Erro ao salvar prédio. Verifique os dados informados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700} size="lg">{buildingToEdit ? 'Editar Prédio' : 'Cadastrar Novo Prédio'}</Text>}
      centered
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <Select
            label="INSTITUIÇÃO RESPONSÁVEL"
            placeholder="Selecione a empresa"
            data={companies.map((c) => ({ value: String(c.id), label: c.companyName }))}
            required
            {...form.getInputProps('companyId')}
          />

          <TextInput
            label="NOME DO PRÉDIO / BLOCO"
            placeholder="Ex: Sede Principal, Bloco A..."
            required
            data-autofocus
            {...form.getInputProps('name')}
          />

          <TextInput
            label="REFERÊNCIA / ENDEREÇO"
            placeholder="Ex: Av. Paulista, 1500 - São Paulo/SP"
            required
            {...form.getInputProps('address')}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={onClose} radius="md" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} radius="md" color="blue.6" c="white">
              Salvar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}