import {
  Title,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Avatar,
  Stack,
  Loader,
  Center
} from '@mantine/core';
import { useDebouncedValue, useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconEye,
  IconQrcode,
  IconCamera
} from '@tabler/icons-react';
import { useState, useRef } from 'react';
import { useServerPagination } from '../../hooks/useServerPagination';
import { TablePagination } from '../../components/TablePagination';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { AssetModal } from './components/AssetModal';
import { AssetDetailsModal } from './components/AssetDetailsModal';
import { alertApiError } from '../../utils/apiError';
import { useSelectOptions } from '../../hooks/useSelectOptions';

const API_ORIGIN = 'http://localhost:8080';
const resolveAssetUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface SectorInfo {
  id: number;
  name: string;
}

interface CategoryInfo {
  id: number;
  name: string;
}

interface EmployeeInfo {
  id: number;
  name: string;
}

type ConservationState = 'NEW' | 'GOOD' | 'REGULAR' | 'BAD' | 'UNSERVICEABLE';

interface Asset {
  id: number;
  tagNumber: string;
  name: string;
  description?: string;
  model?: string;
  serialNumber?: string;
  status: 'AVAILABLE' | 'IN_USE' | 'IN_MAINTENANCE' | 'DISCARDED';
  sector?: SectorInfo;
  category?: CategoryInfo | null;
  responsible?: EmployeeInfo | null;
  acquisitionDate?: string | null;
  acquisitionValue?: number | null;
  conservationState?: ConservationState | null;
  photoUrl?: string | null;
  active: boolean;
  createdAt?: string;
}

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

export function AssetsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAssetId, setUploadingAssetId] = useState<number | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const [assetToEdit, setAssetToEdit] = useState<AssetToEdit | null>(null);
  const [assetToView, setAssetToView] = useState<Asset | null>(null);


  const handleCreateNew = () => {
    setAssetToEdit(null);
    openModal();
  };

  const handleEdit = (asset: Asset) => {
    setAssetToEdit({
      id: asset.id,
      tagNumber: asset.tagNumber,
      name: asset.name,
      description: asset.description,
      model: asset.model,
      serialNumber: asset.serialNumber,
      status: asset.status,
      sectorId: asset.sector?.id || 0,
      categoryId: asset.category?.id,
      responsibleId: asset.responsible?.id,
      acquisitionDate: asset.acquisitionDate,
      acquisitionValue: asset.acquisitionValue,
      conservationState: asset.conservationState,
    });
    openModal();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Deseja realmente inativar este bem patrimonial?')) {
      try {
        await api.delete(`/assets/${id}`);
        pagination.reload();
      } catch (error) {
        alertApiError(error, 'Erro ao inativar ativo.');
      }
    }
  };

  const handlePhotoClick = (assetId: number) => {
    setUploadingAssetId(assetId);
    photoInputRef.current?.click();
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !uploadingAssetId) return;

    const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Formato inválido. Envie um arquivo PNG, JPG ou WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assets/${uploadingAssetId}/photo`, formData);
      pagination.reload();
    } catch (error) {
      alertApiError(error, 'Erro ao enviar a foto. Tente novamente.');
    } finally {
      setUploadingAssetId(null);
    }
  };

  // Mapeamento visual das Badges de Status
  const renderStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <Badge variant="light" color="green" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
            Disponível
          </Badge>
        );
      case 'IN_USE':
        return (
          <Badge variant="light" color="blue" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
            Em Uso
          </Badge>
        );
      case 'IN_MAINTENANCE':
        return (
          <Badge variant="light" color="orange" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
            Em Manutenção
          </Badge>
        );
      case 'DISCARDED':
        return (
          <Badge variant="light" color="red" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
            Baixado/Inativo
          </Badge>
        );
      default:
        return (
          <Badge variant="light" color="gray" radius="md" size="md" px="xs" style={{ textTransform: 'none', fontWeight: 600 }}>
            {status}
          </Badge>
        );
    }
  };

  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Paginação, busca e filtros feitos no backend
  const pagination = useServerPagination<Asset>(
    '/assets',
    { q: debouncedSearch, status: statusFilter, sectorId: locationFilter, categoryId: categoryFilter },
    { sort: 'name,asc' }
  );

  // Opções dos filtros vêm dos cadastros (o valor enviado ao backend é o id)
  const locationOptions = useSelectOptions<{ id: number; name: string }>('/sectors', (s) => s.name);
  const categoryOptions = useSelectOptions<{ id: number; name: string }>('/asset-categories', (c) => c.name);

  if (pagination.initialLoading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <AssetModal
        opened={modalOpened}
        onClose={closeModal}
        onSuccess={pagination.reload}
        assetToEdit={assetToEdit}
      />

      <AssetDetailsModal
        asset={assetToView}
        photoSrc={resolveAssetUrl(assetToView?.photoUrl)}
        onClose={() => setAssetToView(null)}
      />

      {/* Input de arquivo oculto para upload de foto */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>Patrimônio</Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={handleCreateNew}
            c="white"
          >
            Cadastrar Novo Bem
          </Button>
        )}
      </Group>

      {/* 2. FILTROS */}
      <Group gap="md" grow wrap="wrap">
        <TextInput
          placeholder="Buscar por código, nome ou modelo..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 2 }}
        />
        <Select
          placeholder="Filtrar por Status"
          data={[
            { value: 'AVAILABLE', label: 'Disponível' },
            { value: 'IN_USE', label: 'Em Uso' },
            { value: 'IN_MAINTENANCE', label: 'Em Manutenção' },
            { value: 'DISCARDED', label: 'Baixado/Inativo' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          radius="md"
          clearable
        />
        <Select
          placeholder="Filtrar por Localização"
          data={locationOptions}
          value={locationFilter}
          onChange={setLocationFilter}
          radius="md"
          clearable
        />
        <Select
          placeholder="Filtrar por Categoria"
          data={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
          radius="md"
          clearable
        />
      </Group>

      {/* 3. TABELA DE BENS PATRIMONIAIS */}
      <Paper radius="md" withBorder style={{ overflow: 'hidden' }}>
        <Table verticalSpacing="md" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Tr>
              <Table.Th style={{ width: '48px' }}></Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>TAG / ID</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>NOME DO ITEM</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>MODELO / MARCA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>CATEGORIA</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>LOCALIZAÇÃO</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px' }}>STATUS</Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: '11px', letterSpacing: '0.5px', textAlign: 'center' }}>AÇÕES</Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {pagination.items.length > 0 ? (
              pagination.items.map((asset) => (
                <Table.Tr key={asset.id}>
                  {/* Foto */}
                  <Table.Td>
                    <Avatar src={resolveAssetUrl(asset.photoUrl)} radius="md" size="sm">
                      {asset.name.charAt(0).toUpperCase()}
                    </Avatar>
                  </Table.Td>

                  {/* TAG/Tombamento */}
                  <Table.Td fw={700} c="gray.9" style={{ fontSize: '13px' }}>
                    {asset.tagNumber}
                  </Table.Td>

                  {/* Nome do Item */}
                  <Table.Td fw={700} c="gray.8" style={{ fontSize: '14px' }}>
                    {asset.name}
                  </Table.Td>

                  {/* Modelo / Marca */}
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {asset.model || '-'}
                  </Table.Td>

                  {/* Categoria */}
                  <Table.Td c="gray.6" fw={500} style={{ fontSize: '14px' }}>
                    {asset.category?.name || '-'}
                  </Table.Td>

                  {/* Localização / Setor */}
                  <Table.Td c="gray.7" fw={600} style={{ fontSize: '14px' }}>
                    {asset.sector?.name || 'Não alocado'}
                  </Table.Td>

                  {/* Status */}
                  <Table.Td>
                    {renderStatusBadge(asset.status)}
                  </Table.Td>

                  {/* Ações */}
                  <Table.Td>
                    <Group gap="xs" justify="center" wrap="nowrap">
                      <ActionIcon variant="subtle" color="gray.6" size="sm" title="Etiqueta QR Code">
                        <IconQrcode size={16} />
                      </ActionIcon>
                      <ActionIcon variant="subtle" color="gray.6" size="sm" title="Visualizar" onClick={() => setAssetToView(asset)}>
                        <IconEye size={16} />
                      </ActionIcon>
                      {isAdmin && (
                        <>
                          <ActionIcon variant="subtle" color="gray.6" size="sm" title="Enviar Foto" onClick={() => handlePhotoClick(asset.id)}>
                            <IconCamera size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="gray.6" size="sm" title="Editar" onClick={() => handleEdit(asset)}>
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon variant="subtle" color="red.6" size="sm" title="Inativar" onClick={() => handleDelete(asset.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhum bem patrimonial encontrado.
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <TablePagination {...pagination} disabled={pagination.loading} />
      </Paper>
    </Stack>
  );
}