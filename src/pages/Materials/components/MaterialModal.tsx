import { 
  Modal, 
  TextInput, 
  Button, 
  Group, 
  Stack 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

interface MaterialToEdit {
  id: number;
  name: string;
  category: string;
}

interface MaterialModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  materialToEdit?: MaterialToEdit | null;
}

export function MaterialModal({
  opened,
  onClose,
  onSuccess,
  materialToEdit
}: MaterialModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      category: '',
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? 'Nome deve ter no mínimo 2 caracteres' : null),
      category: (val) => (val.trim().length < 2 ? 'Categoria é obrigatória' : null),
    },
  });

  useEffect(() => {
    if (materialToEdit) {
      form.setValues({
        name: materialToEdit.name || '',
        category: materialToEdit.category || '',
      });
    } else {
      form.reset();
    }
  }, [materialToEdit, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        category: values.category,
      };

      if (materialToEdit) {
        await api.put(`/materials/${materialToEdit.id}`, payload);
      } else {
        await api.post('/materials', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={materialToEdit ? 'Editar Material' : 'Cadastrar Material'}
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome do Material"
            placeholder="Ex: Notebook, Monitor, Cadeira..."
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="Categoria"
            placeholder="Ex: Informática, Periféricos, Móveis..."
            required
            {...form.getInputProps('category')}
          />

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {materialToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}