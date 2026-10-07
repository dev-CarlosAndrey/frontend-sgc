import {
  Modal,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Stack
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

interface AssetCategoryToEdit {
  id: number;
  name: string;
  description?: string;
  active: boolean;
}

interface AssetCategoryModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: AssetCategoryToEdit | null;
}

export function AssetCategoryModal({
  opened,
  onClose,
  onSuccess,
  categoryToEdit,
}: AssetCategoryModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      active: true,
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? 'Nome deve ter no mínimo 2 caracteres' : null),
    },
  });

  useEffect(() => {
    if (categoryToEdit) {
      form.setValues({
        name: categoryToEdit.name || '',
        description: categoryToEdit.description || '',
        active: categoryToEdit.active,
      });
    } else {
      form.reset();
    }
  }, [categoryToEdit, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        description: values.description || null,
        active: values.active,
      };

      if (categoryToEdit) {
        await api.put(`/asset-categories/${categoryToEdit.id}`, payload);
      } else {
        await api.post('/asset-categories', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria de bem:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={categoryToEdit ? 'Editar Categoria' : 'Cadastrar Categoria'}
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome da Categoria"
            placeholder="Ex: Informática, Mobiliário, Veículos..."
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Descrição"
            placeholder="Detalhes sobre a categoria (opcional)..."
            rows={3}
            {...form.getInputProps('description')}
          />

          {categoryToEdit && (
            <Switch
              label="Categoria ativa"
              checked={form.values.active}
              onChange={(e) => form.setFieldValue('active', e.currentTarget.checked)}
            />
          )}

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {categoryToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
