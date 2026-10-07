import {
  Modal,
  TextInput,
  PasswordInput,
  Select,
  Button,
  Group,
  Stack,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

type Role = 'ADMIN' | 'TECHNICIAN' | 'USER';

interface UserToEdit {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
}

interface UserModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserToEdit | null;
}

export function UserModal({
  opened,
  onClose,
  onSuccess,
  userToEdit,
}: UserModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'USER' as Role,
    },
    validate: {
      name: (val) => (val.trim().length < 3 ? 'Nome (login) deve ter no mínimo 3 caracteres' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'E-mail inválido'),
      password: (val) => {
        if (userToEdit) return null; // opcional na edição: vazio mantém a senha atual
        return val.length < 6 ? 'Senha deve ter no mínimo 6 caracteres' : null;
      },
      role: (val) => (!val ? 'Selecione o perfil de acesso' : null),
    },
  });

  useEffect(() => {
    if (userToEdit) {
      form.setValues({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '',
        phone: userToEdit.phone || '',
        role: userToEdit.role || 'USER',
      });
    } else {
      form.reset();
    }
  }, [userToEdit, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        phone: values.phone || null,
        role: values.role,
      };

      if (userToEdit) {
        await api.put(`/users/${userToEdit.id}`, payload);
      } else {
        await api.post('/users', payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      if (error.response?.data?.detail) {
        form.setFieldError('email', error.response.data.detail);
      } else {
        console.error('Erro ao salvar usuário:', error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={userToEdit ? 'Editar Usuário' : 'Cadastrar Usuário'}
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome (usado como login)"
            placeholder="Ex: joao.silva"
            required
            {...form.getInputProps('name')}
          />

          <TextInput
            label="E-mail"
            placeholder="joao.silva@empresa.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            label="Senha"
            placeholder={userToEdit ? 'Deixe em branco para manter a atual' : 'Mínimo de 6 caracteres'}
            required={!userToEdit}
            {...form.getInputProps('password')}
          />

          <TextInput
            label="Telefone"
            placeholder="(00) 00000-0000"
            {...form.getInputProps('phone')}
          />

          <Select
            label="Perfil de Acesso"
            data={[
              { value: 'ADMIN', label: 'Administrador' },
              { value: 'TECHNICIAN', label: 'Técnico' },
              { value: 'USER', label: 'Usuário' },
            ]}
            required
            {...form.getInputProps('role')}
          />

          {userToEdit && (
            <Text size="xs" c="dimmed">
              Deixe a senha em branco para não alterá-la.
            </Text>
          )}

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {userToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
