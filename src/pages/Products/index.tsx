import { 
  Title, 
  Paper, 
  Group, 
  Button, 
  TextInput, 
  Table, 
  Badge, 
  ActionIcon, 
  Stack,
  Loader,
  Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconPlus, 
  IconSearch, 
  IconEdit, 
  IconTrash 
} from '@tabler/icons-react';
import { useState, useEffect, useCallback } from 'react';
import { usePagination } from '../../hooks/usePagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ProductModal } from './components/ProductModal';

interface Product {
  id: number;
  name: string;
  description?: string;
  brandId: number;
  brandName?: string;
  materialId: number;
  materialName?: string;
  category?: string;
  active: boolean;
  createdAt?: string;
}

interface ProductToEdit {
  id: number;
  name: string;
  description?: string;
  brandId: number;
  materialId: number;
}

export function ProductsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productToEdit, setProductToEdit] = useState<ProductToEdit | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/products?size=1000');
      setProducts(extractData(response));
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateNew = () => {
    setProductToEdit(null);
    openModal();
  };

  const handleEdit = (product: Product) => {
    setProductToEdit({
      id: product.id,
      name: product.name,
      description: product.description,
      brandId: product.brandId,
      materialId: product.materialId,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este produto/modelo?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Erro ao inativar produto:', error);
      }
    }
  };

  const formatCode = (id: number) => {
    return `PRD-${String(id).padStart(3, '0')}`;
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.materialName && p.materialName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    formatCode(p.id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pagination = usePagination(filteredProducts);

  if (loading && products.length === 0) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <ProductModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={fetchProducts}
          productToEdit={productToEdit}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Catálogo de Produtos / Modelos</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Adicionar
          </Button>
        )}
      </Group>

      {/* 2. FILTRO DE BUSCA */}
      <div style={{ maxWidth: '400px' }}>
        <TextInput
          placeholder="Buscar produto por nome, marca ou categoria..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
        />
      </div>

      {/* 3. TABELA DE PRODUTOS */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>ID</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>MODELO / PRODUTO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>MARCA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>MATERIAL / CATEGORIA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              {isAdmin && (
                <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
              )}
            </Table.Tr>
          </Table.Thead>
          
          <Table.Tbody>
            {filteredProducts.length > 0 ? (
              pagination.pageItems.map((product) => (
                <Table.Tr key={product.id}>
                  {/* Código PRD-00X */}
                  <Table.Td c="dimmed" fw={500} style={{ fontSize: '13px' }}>
                    {formatCode(product.id)}
                  </Table.Td>

                  {/* Nome e Descrição */}
                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {product.name}
                  </Table.Td>

                  {/* Marca */}
                  <Table.Td c="gray.7" fw={600} style={{ fontSize: '14px' }}>
                    {product.brandName || '-'}
                  </Table.Td>

                  {/* Material e Categoria */}
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {product.materialName 
                      ? `${product.materialName} ${product.category ? `(${product.category})` : ''}` 
                      : '-'}
                  </Table.Td>

                  {/* Status */}
                  <Table.Td>
                    {product.active ? (
                      <Badge variant="light" color="green" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="light" color="gray" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
                        Inativo
                      </Badge>
                    )}
                  </Table.Td>

                  {/* Ações */}
                  {isAdmin && (
                    <Table.Td>
                      <Group gap="xs" justify="center" wrap="nowrap">
                        <ActionIcon variant="subtle" color="gray.6" size="sm" onClick={() => handleEdit(product)}>
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red.6" size="sm" onClick={() => handleDelete(product.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum produto cadastrado.
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <TablePagination {...pagination} />
      </Paper>
    </Stack>
  );
}