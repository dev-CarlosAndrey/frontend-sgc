import {
  Title,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  Text,
  Stack,
  Loader,
  Center,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconSearch, IconArrowRight } from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { usePagination } from "../../hooks/usePagination";
import { TablePagination } from "../../components/TablePagination";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { MovementModal } from "./components/MovementModal";

interface MovementResponse {
  id: number;
  assetId: number;
  assetTagNumber: string;
  assetName: string;
  originSectorId: number;
  originSectorName: string;
  destinationSectorId: number;
  destinationSectorName: string;
  reason?: string;
  movementDate: string;
}

export function MovementsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [movements, setMovements] = useState<MovementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState<string | null>(null);

  const extractData = (response: any) => {
    if (Array.isArray(response.data)) return response.data;
    if (response.data?.content && Array.isArray(response.data.content)) return response.data.content;
    return [];
  };

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/asset-movements?size=1000");
      setMovements(extractData(response));
    } catch (error) {
      console.error("Erro ao buscar histórico de movimentações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  // Formata data e hora
  const formatDateTime = (isoDate: string) => {
    if (!isoDate) return { date: "-", time: "-" };
    const dateObj = new Date(isoDate);
    return {
      date: dateObj.toLocaleDateString("pt-BR"),
      time: dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Filtragem
  const filteredMovements = movements.filter((m) => {
    const matchesSearch =
      m.assetTagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.originSectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.destinationSectorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDestination = destinationFilter
      ? m.destinationSectorName === destinationFilter
      : true;

    return matchesSearch && matchesDestination;
  });

  const pagination = usePagination(filteredMovements);

  const destinationOptions = Array.from(
    new Set(movements.map((m) => m.destinationSectorName).filter(Boolean))
  ) as string[];

  if (loading && movements.length === 0) {
    return (
      <Center style={{ height: "60vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <MovementModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={fetchMovements}
        />
      )}

      {/* 1. CABEÇALHO */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>
          Histórico de Movimentações
        </Title>
        {isAdmin && (
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="blue.6"
            onClick={openModal}
            c="white"
          >
            Nova Movimentação
          </Button>
        )}
      </Group>

      {/* 2. FILTROS DA TABELA */}
      <Group gap="md" grow wrap="wrap">
        <TextInput
          placeholder="Buscar por TAG, item ou setor..."
          leftSection={<IconSearch size={16} color="gray" />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          radius="md"
          style={{ flexGrow: 1 }}
        />
        <Select
          placeholder="Filtrar por Setor de Destino"
          data={destinationOptions}
          value={destinationFilter}
          onChange={setDestinationFilter}
          radius="md"
          style={{ flexGrow: 1 }}
          clearable
        />
      </Group>

      {/* 3. TABELA DE MOVIMENTAÇÕES */}
      <Paper radius="md" withBorder style={{ overflow: "hidden" }}>
        <Table verticalSpacing="sm" horizontalSpacing="xl" highlightOnHover>
          <Table.Thead style={{ backgroundColor: "#f8f9fa" }}>
            <Table.Tr>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                DATA
              </Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                ATIVO
              </Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                ORIGEM
              </Table.Th>
              <Table.Th style={{ width: "40px" }}></Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                DESTINO
              </Table.Th>
              <Table.Th c="dimmed" fw={700} style={{ fontSize: "11px", letterSpacing: "0.5px" }}>
                MOTIVO / OBSERVAÇÃO
              </Table.Th>
            </Table.Tr>
          </Table.Thead>

          <Table.Tbody>
            {filteredMovements.length > 0 ? (
              pagination.pageItems.map((movement) => {
                const { date, time } = formatDateTime(movement.movementDate);
                return (
                  <Table.Tr key={movement.id}>
                    {/* Data e Hora */}
                    <Table.Td style={{ minWidth: "120px" }}>
                      <Text fw={700} c="gray.8" style={{ fontSize: "13px" }}>
                        {date}
                      </Text>
                      <Text c="dimmed" style={{ fontSize: "11px" }}>
                        {time}
                      </Text>
                    </Table.Td>

                    {/* Ativo / Patrimônio */}
                    <Table.Td>
                      <Text fw={700} c="gray.8" style={{ fontSize: "13px" }}>
                        {movement.assetTagNumber}
                      </Text>
                      <Text c="dimmed" style={{ fontSize: "12px" }}>
                        {movement.assetName}
                      </Text>
                    </Table.Td>

                    {/* Origem */}
                    <Table.Td>
                      <Badge
                        variant="light"
                        color="gray.4"
                        c="gray.8"
                        radius="md"
                        size="md"
                        px="xs"
                        style={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {movement.originSectorName}
                      </Badge>
                    </Table.Td>

                    {/* Ícone de Seta */}
                    <Table.Td style={{ padding: 0, textAlign: "center" }}>
                      <IconArrowRight size={16} color="#adb5bd" />
                    </Table.Td>

                    {/* Destino */}
                    <Table.Td>
                      <Badge
                        variant="filled"
                        color="blue.6"
                        radius="md"
                        size="md"
                        px="xs"
                        style={{ textTransform: "none", fontWeight: 600 }}
                      >
                        {movement.destinationSectorName}
                      </Badge>
                    </Table.Td>

                    {/* Motivo */}
                    <Table.Td c="gray.7" style={{ fontSize: "13px" }}>
                      {movement.reason || "-"}
                    </Table.Td>
                  </Table.Tr>
                );
              })
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                  <Badge variant="subtle" color="gray" size="lg">
                    Nenhuma movimentação registrada.
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