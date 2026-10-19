import { 
  Modal, 
  TextInput, 
  Select, 
  Button, 
  Group, 
  Stack, 
  Textarea 
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect, useState, useCallback } from 'react';
import { api } from '../../../services/api';
import { showFormApiError } from '../../../utils/apiError';

interface BrandOption {
  id: number;
  name: string;
}

interface MaterialOption {
  id: number;
  name: string;
  category: string;
}

interface ProductToEdit {
  id: number;
  name: string;
  description?: string;
  brandId: number;
  materialId: number;
}

interface ProductModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: ProductToEdit | null;
}

export function ProductModal({
  opened,
  onClose,
  onSuccess,
  productToEdit,
}: ProductModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);

  // Normalizador auxiliar para tratar respostas (Array simples ou PageImpl)
  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  // Carrega as opções de Marcas e Materiais para alimentar os Selects
  const fetchSelectOptions = useCallback(async () => {
    try {
      const [brandsRes, materialsRes] = await Promise.all([
        api.get('/brands?size=1000'),
        api.get('/materials?size=1000'),
      ]);
      setBrands(extractData(brandsRes));
      setMaterials(extractData(materialsRes));
    } catch (error) {
      console.error('Erro ao carregar opções para o modal de produto:', error);
    }
  }, []);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      brandId: '',
      materialId: '',
    },
    validate: {
      name: (val) => (val.trim().length < 2 ? 'Nome do produto/modelo é obrigatório' : null),
      brandId: (val) => (!val ? 'Selecione uma marca' : null),
      materialId: (val) => (!val ? 'Selecione um material/categoria' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      fetchSelectOptions();

      if (productToEdit) {
        form.setValues({
          name: productToEdit.name || '',
          description: productToEdit.description || '',
          brandId: String(productToEdit.brandId || ''),
          materialId: String(productToEdit.materialId || ''),
        });
      } else {
        form.reset();
      }
    }
  }, [opened, productToEdit, fetchSelectOptions]);

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setSubmitting(true);

      const payload = {
        name: values.name,
        description: values.description,
        brandId: Number(values.brandId),
        materialId: Number(values.materialId),
      };

      if (productToEdit) {
        await api.put(`/products/${productToEdit.id}`, payload);
      } else {
        await api.post('/products', payload);
      }

      onSuccess();
      onClose();
    } catch (error) {
      showFormApiError(form, error, 'Erro ao salvar produto.');
    } finally {
      setSubmitting(false);
    }
  };

  const brandSelectData = brands.map((b) => ({
    value: String(b.id),
    label: b.name,
  }));

  const materialSelectData = materials.map((m) => ({
    value: String(m.id),
    label: `${m.name} (${m.category})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={productToEdit ? 'Editar Produto / Modelo' : 'Cadastrar Produto / Modelo'}
      centered
      size="md"
      radius="md"
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Nome do Produto / Modelo"
            placeholder="Ex: MacBook Pro 14 M3, Monitor LG 29 UltraWide..."
            required
            {...form.getInputProps('name')}
          />

          <Select
            label="Marca"
            placeholder="Selecione a marca"
            data={brandSelectData}
            searchable
            clearable
            required
            {...form.getInputProps('brandId')}
          />

          <Select
            label="Material / Categoria"
            placeholder="Selecione o tipo de material"
            data={materialSelectData}
            searchable
            clearable
            required
            {...form.getInputProps('materialId')}
          />

          <Textarea
            label="Descrição / Especificações"
            placeholder="Detalhes técnicos adicionais do modelo..."
            rows={3}
            {...form.getInputProps('description')}
          />

          <Group justify="end" mt="md">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} color="blue.6" c="white">
              {productToEdit ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}