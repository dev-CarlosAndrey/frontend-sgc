import { Modal, TextInput, Group, Button, Text, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { api } from '../../../services/api';

interface CompanyModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: (newCompanyId?: number) => void;
}

export function CompanyModal({ opened, onClose, onSuccess }: CompanyModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      companyName: '',
      cnpj: '',
      email: '',
      phone: '',
    },
    validate: {
      companyName: (val) => (val.trim().length < 3 ? 'Razão social muito curta' : null),
      cnpj: (val) => (val.trim().length < 14 ? 'CNPJ inválido' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'E-mail inválido'),
      phone: (val) => (val.trim().length < 8 ? 'Telefone inválido' : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);
      const response = await api.post('/companies', {
        ...values,
        active: true,
      });

      form.reset();
      onSuccess(response.data.id);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.message) {
        form.setFieldError('cnpj', error.response.data.message);
      } else {
        form.setFieldError('companyName', 'Erro ao cadastrar empresa. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={<Text fw={700} size="lg">Cadastrar Nova Instituição</Text>}
      centered
      radius="md"
      size="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="NOME EMPRESARIAL"
            placeholder="Ex: Escola FPO / Faculdade FPO"
            required
            data-autofocus
            {...form.getInputProps('companyName')}
          />

          <TextInput
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            required
            {...form.getInputProps('cnpj')}
          />

          <TextInput
            label="E-MAIL CORPORATIVO"
            placeholder="contato@empresa.com.br"
            required
            {...form.getInputProps('email')}
          />

          <TextInput
            label="TELEFONE"
            placeholder="(88) 3691-0000"
            required
            {...form.getInputProps('phone')}
          />

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={handleClose} radius="md" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} radius="md" color="blue.6">
              Cadastrar Empresa
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}