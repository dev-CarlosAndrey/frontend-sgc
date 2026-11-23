import { Modal, Text, Group, Stack, Badge, Avatar, Divider, SimpleGrid } from '@mantine/core';

export interface EmployeeDetails {
  id: number;
  name: string;
  cpf: string;
  registrationNumber: string;
  email?: string;
  phone?: string;
  position?: string;
  admissionDate?: string;
  active: boolean;
  companyName?: string;
  sectorName?: string;
  createdAt?: string;
}

interface EmployeeDetailsModalProps {
  employee: EmployeeDetails | null;
  onClose: () => void;
}

// admissionDate é LocalDate ("2026-01-15"): formata sem passar por Date para não deslocar o dia pelo fuso
const formatLocalDate = (value?: string) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <Text size="xs" c="dimmed" fw={600} tt="uppercase">{label}</Text>
      <Text size="sm" fw={500}>{value || '-'}</Text>
    </div>
  );
}

export function EmployeeDetailsModal({ employee, onClose }: EmployeeDetailsModalProps) {
  return (
    <Modal
      opened={employee !== null}
      onClose={onClose}
      title={<Text fw={700} size="lg">Detalhes do Funcionário</Text>}
      size="lg"
      radius="md"
      centered
    >
      {employee && (
        <Stack gap="md">
          <Group gap="md">
            <Avatar color="blue" radius="xl" size="lg" fw={700}>
              {getInitials(employee.name)}
            </Avatar>
            <div>
              <Text fw={700} size="lg">{employee.name}</Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">{employee.position || 'Cargo não informado'}</Text>
                <Badge variant="light" color={employee.active ? 'green' : 'gray'} radius="md" style={{ textTransform: 'none' }}>
                  {employee.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </Group>
            </div>
          </Group>

          <Divider />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Field label="Matrícula" value={employee.registrationNumber} />
            <Field label="CPF" value={employee.cpf} />
            <Field label="E-mail" value={employee.email} />
            <Field label="Telefone" value={employee.phone} />
            <Field label="Empresa" value={employee.companyName} />
            <Field label="Setor" value={employee.sectorName} />
            <Field label="Data de Admissão" value={formatLocalDate(employee.admissionDate)} />
            <Field
              label="Cadastrado em"
              value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('pt-BR') : undefined}
            />
          </SimpleGrid>
        </Stack>
      )}
    </Modal>
  );
}
