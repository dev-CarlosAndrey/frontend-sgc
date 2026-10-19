import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { DateInputBR } from '../../../components/DateInputBR';
import { showFormApiError } from '../../../utils/apiError';

interface CompanyOption {
  id: number;
  companyName?: string;
  name?: string;
}

interface SectorOption {
  id: number;
  name: string;
}

interface EmployeeToEdit {
  id: number;
  name: string;
  cpf: string;
  registrationNumber: string;
  email?: string;
  phone?: string;
  position?: string;
  admissionDate?: string;
  companyId: number;
  sectorId?: number;
}

interface EmployeeModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companies: CompanyOption[];
  sectors: SectorOption[];
  employeeToEdit?: EmployeeToEdit | null;
}

export function EmployeeModal({
  opened,
  onClose,
  onSuccess,
  companies,
  sectors,
  employeeToEdit
}: EmployeeModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      cpf: '',
      registrationNumber: '',
      email: '',
      phone: '',
      position: '',
      admissionDate: '',
      companyId: '',
      sectorId: '',
    },
    validate: {
      name: (val) => (val.trim().length < 3 ? 'Nome deve ter no mínimo 3 caracteres' : null),
      cpf: (val) => (!val ? 'CPF é obrigatório' : null),
      registrationNumber: (val) => (!val ? 'Matrícula é obrigatória' : null),
      companyId: (val) => (!val ? 'Empresa é obrigatória' : null),
    },
  });

  useEffect(() => {
    if (employeeToEdit) {
      form.setValues({
        name: employeeToEdit.name || '',
        cpf: employeeToEdit.cpf || '',
        registrationNumber: employeeToEdit.registrationNumber || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        position: employeeToEdit.position || '',
        admissionDate: employeeToEdit.admissionDate || '',
        companyId: employeeToEdit.companyId ? String(employeeToEdit.companyId) : '',
        sectorId: employeeToEdit.sectorId ? String(employeeToEdit.sectorId) : '',
      });
    } else {
      form.reset();
    }
  }, [employeeToEdit, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        cpf: values.cpf,
        registrationNumber: values.registrationNumber,
        email: values.email || null,
        phone: values.phone || null,
        position: values.position || null,
        admissionDate: values.admissionDate || null,
        companyId: Number(values.companyId),
        sectorId: values.sectorId ? Number(values.sectorId) : null,
      };

      if (employeeToEdit) {
        await api.put(`/employees/${employeeToEdit.id}`, payload);
      } else {
        await api.post('/employees', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      showFormApiError(form, error, 'Erro ao salvar funcionário.');
    } finally {
      setSubmitting(false);
    }
  };

  const companyData = companies.map((c) => ({
    value: String(c.id),
    label: c.companyName || c.name || `Empresa ${c.id}`,
  }));

  const sectorData = sectors.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={employeeToEdit ? 'Editar Funcionário' : 'Cadastrar Funcionário'}
      centered
      size="lg"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome Completo"
            placeholder="Ex: Carlos Eduardo Mendes"
            required
            {...form.getInputProps('name')}
          />

          <Group grow>
            <TextInput
              label="CPF"
              placeholder="000.000.000-00"
              required
              {...form.getInputProps('cpf')}
            />
            <TextInput
              label="Matrícula"
              placeholder="Ex: FUNC-2023-001"
              required
              {...form.getInputProps('registrationNumber')}
            />
          </Group>

          <Group grow>
            <Select
              label="Empresa"
              placeholder="Selecione a empresa"
              data={companyData}
              required
              {...form.getInputProps('companyId')}
            />
            <Select
              label="Setor"
              placeholder="Selecione o setor"
              data={sectorData}
              clearable
              {...form.getInputProps('sectorId')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Cargo"
              placeholder="Ex: Técnico de Suporte"
              {...form.getInputProps('position')}
            />
            <DateInputBR
              label="Data de Admissão"
              clearable
              {...form.getInputProps('admissionDate')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="E-mail"
              placeholder="Ex: carlos@empresa.com"
              {...form.getInputProps('email')}
            />
            <TextInput
              label="Telefone"
              placeholder="(00) 00000-0000"
              {...form.getInputProps('phone')}
            />
          </Group>

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {employeeToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}