import { Modal, TextInput, Group, Button, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

interface BrandToEdit {
  id: number;
  name: string;
}

interface BrandModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  brandToEdit?: BrandToEdit | null;
}

export function BrandModal({ opened, onClose, onSuccess, brandToEdit }: BrandModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'O nome da marca deve ter pelo menos 2 caracteres' : null),
    },
  });

  useEffect(() => {
    if (brandToEdit) {
      form.setValues({ name: brandToEdit.name || '' });
    } else {
      form.reset();
    }
  }, [brandToEdit, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setLoading(true);

      if (brandToEdit) {
        await api.put(`/brands/${brandToEdit.id}`, { name: values.name.trim() });
      } else {
        await api.post('/brands', { name: values.name.trim() });
      }

      form.reset();
      onSuccess(); // Recarrega a tabela
      onClose();   // Fecha o modal
    } catch (error: any) {
      if (error.response?.data?.message) {
        form.setFieldError('name', error.response.data.message);
      } else {
        form.setFieldError('name', 'Erro ao salvar marca. Verifique a conexão com a API.');
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
      title={<Text fw={700} size="lg">{brandToEdit ? 'Editar Marca' : 'Cadastrar Nova Marca'}</Text>}
      centered
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Nome da Marca"
          placeholder="Ex: Dell, HP, Apple..."
          required
          data-autofocus
          {...form.getInputProps('name')}
        />

        <Group justify="flex-end" mt="xl">
          <Button variant="default" onClick={handleClose} radius="md" disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} radius="md" color="blue.6">
            Salvar Marca
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
