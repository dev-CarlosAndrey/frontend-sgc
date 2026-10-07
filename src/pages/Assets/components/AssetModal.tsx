import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Textarea,
  NumberInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { DateInputBR } from '../../../components/DateInputBR';

interface SectorOption {
  id: number;
  name: string;
}

interface ProductOption {
  id: number;
  name: string;
  brandName?: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

interface EmployeeOption {
  id: number;
  name: string;
}

type ConservationState = 'NEW' | 'GOOD' | 'REGULAR' | 'BAD' | 'UNSERVICEABLE';

interface AssetToEdit {
  id: number;
  tagNumber: string;
  name: string;
  description?: string;
  model?: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'IN_USE' | 'IN_MAINTENANCE' | 'DISCARDED';
  sectorId: number;
  categoryId?: number | null;
  responsibleId?: number | null;
  acquisitionDate?: string | null;
  acquisitionValue?: number | null;
  conservationState?: ConservationState | null;
}

interface AssetModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetToEdit?: AssetToEdit | null;
}

export function AssetModal({
  opened,
  onClose,
  onSuccess,
  assetToEdit,
}: AssetModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [sectors, setSectors] = useState<SectorOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchOptions = useCallback(async () => {
    try {
      const [sectorsRes, productsRes, categoriesRes, employeesRes] = await Promise.all([
        api.get('/sectors?size=1000'),
        api.get('/products?size=1000'),
        api.get('/asset-categories?size=1000'),
        api.get('/employees?size=1000'),
      ]);
      setSectors(extractData(sectorsRes));
      setProducts(extractData(productsRes));
      setCategories(extractData(categoriesRes));
      setEmployees(extractData(employeesRes));
    } catch (error) {
      console.error('Erro ao carregar opções para o modal de ativo:', error);
    }
  }, []);

  const form = useForm({
    initialValues: {
      tagNumber: '',
      name: '',
      model: '',
      serialNumber: '',
      status: 'AVAILABLE',
      sectorId: '',
      categoryId: '',
      responsibleId: '',
      acquisitionDate: '',
      acquisitionValue: '' as number | string,
      conservationState: '' as ConservationState | '',
      description: '',
    },
    validate: {
      tagNumber: (val) => (!val.trim() ? 'Número de tombamento é obrigatório' : null),
      name: (val) => (val.trim().length < 2 ? 'Nome do item é obrigatório' : null),
      status: (val) => (!val ? 'Status é obrigatório' : null),
      sectorId: (val) => (!val ? 'Setor/Localização é obrigatório' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      fetchOptions();

      if (assetToEdit) {
        form.setValues({
          tagNumber: assetToEdit.tagNumber || '',
          name: assetToEdit.name || '',
          model: assetToEdit.model || '',
          serialNumber: assetToEdit.serialNumber || '',
          status: assetToEdit.status || 'AVAILABLE',
          sectorId: String(assetToEdit.sectorId || ''),
          categoryId: assetToEdit.categoryId ? String(assetToEdit.categoryId) : '',
          responsibleId: assetToEdit.responsibleId ? String(assetToEdit.responsibleId) : '',
          acquisitionDate: assetToEdit.acquisitionDate || '',
          acquisitionValue: assetToEdit.acquisitionValue ?? '',
          conservationState: assetToEdit.conservationState || '',
          description: assetToEdit.description || '',
        });
      } else {
        form.reset();
      }
    }
  }, [opened, assetToEdit, fetchOptions]);

  // Ao selecionar um Produto/Modelo pré-cadastrado no catálogo, preenche o Nome e Modelo automaticamente
  const handleSelectProduct = (productId: string | null) => {
    if (!productId) return;
    const selectedProduct = products.find((p) => String(p.id) === productId);
    if (selectedProduct) {
      form.setFieldValue('name', selectedProduct.name);
      if (selectedProduct.brandName) {
        form.setFieldValue('model', selectedProduct.brandName);
      }
    }
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        tagNumber: values.tagNumber,
        name: values.name,
        description: values.description || null,
        model: values.model || null,
        serialNumber: values.serialNumber || null,
        status: values.status,
        sectorId: Number(values.sectorId),
        categoryId: values.categoryId ? Number(values.categoryId) : null,
        responsibleId: values.responsibleId ? Number(values.responsibleId) : null,
        acquisitionDate: values.acquisitionDate || null,
        acquisitionValue: values.acquisitionValue === '' ? null : Number(values.acquisitionValue),
        conservationState: values.conservationState || null,
      };

      if (assetToEdit) {
        await api.put(`/assets/${assetToEdit.id}`, payload);
      } else {
        await api.post('/assets', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar patrimônio:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const sectorSelectData = sectors.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const productSelectData = products.map((p) => ({
    value: String(p.id),
    label: p.brandName ? `${p.name} (${p.brandName})` : p.name,
  }));

  const categorySelectData = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const employeeSelectData = employees.map((e) => ({
    value: String(e.id),
    label: e.name,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={assetToEdit ? 'Editar Bem Patrimonial' : 'Cadastrar Novo Bem'}
      centered
      size="lg"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          {/* Opcional: Pré-carregar dados do Catálogo */}
          {!assetToEdit && productSelectData.length > 0 && (
            <Select
              label="Copiar dados do Catálogo (Opcional)"
              placeholder="Selecione um Modelo/Produto pré-cadastrado..."
              data={productSelectData}
              searchable
              clearable
              onChange={handleSelectProduct}
            />
          )}

          <Group grow>
            <TextInput
              label="Tombamento / TAG"
              placeholder="Ex: PAT-2026-001"
              required
              {...form.getInputProps('tagNumber')}
            />
            <TextInput
              label="Nome do Item"
              placeholder="Ex: Notebook Dell Inspiron 15"
              required
              {...form.getInputProps('name')}
            />
          </Group>

          <Group grow>
            <Select
              label="Localização / Setor"
              placeholder="Selecione o setor"
              data={sectorSelectData}
              searchable
              required
              {...form.getInputProps('sectorId')}
            />
            <Select
              label="Status do Ativo"
              placeholder="Selecione o status"
              data={[
                { value: 'AVAILABLE', label: 'Disponível / Ativo' },
                { value: 'IN_USE', label: 'Em Uso' },
                { value: 'IN_MAINTENANCE', label: 'Em Manutenção' },
                { value: 'DISCARDED', label: 'Baixado / Inativo' },
              ]}
              required
              {...form.getInputProps('status')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Modelo / Marca"
              placeholder="Ex: Inspiron 15 5000"
              {...form.getInputProps('model')}
            />
            <TextInput
              label="Número de Série"
              placeholder="Ex: SN-987654321"
              {...form.getInputProps('serialNumber')}
            />
          </Group>

          <Group grow>
            <Select
              label="Categoria"
              placeholder="Selecione a categoria (opcional)"
              data={categorySelectData}
              searchable
              clearable
              {...form.getInputProps('categoryId')}
            />
            <Select
              label="Responsável"
              placeholder="Funcionário responsável (opcional)"
              data={employeeSelectData}
              searchable
              clearable
              {...form.getInputProps('responsibleId')}
            />
          </Group>

          <Group grow>
            <DateInputBR
              label="Data de Aquisição"
              clearable
              {...form.getInputProps('acquisitionDate')}
            />
            <NumberInput
              label="Valor de Aquisição (R$)"
              placeholder="0,00"
              min={0}
              decimalScale={2}
              {...form.getInputProps('acquisitionValue')}
            />
            <Select
              label="Estado de Conservação"
              placeholder="Selecione (opcional)"
              data={[
                { value: 'NEW', label: 'Novo' },
                { value: 'GOOD', label: 'Bom' },
                { value: 'REGULAR', label: 'Regular' },
                { value: 'BAD', label: 'Ruim' },
                { value: 'UNSERVICEABLE', label: 'Inservível' },
              ]}
              clearable
              {...form.getInputProps('conservationState')}
            />
          </Group>

          <Textarea
            label="Descrição / Observações"
            placeholder="Informações adicionais do bem..."
            rows={3}
            {...form.getInputProps('description')}
          />

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {assetToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}