import { Group, Pagination, Select, Text } from '@mantine/core';
import { PAGE_SIZE_OPTIONS } from '../../hooks/useServerPagination';

interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  disabled?: boolean;
}

export function TablePagination({
  page,
  pageSize,
  totalPages,
  totalElements,
  setPage,
  setPageSize,
  disabled,
}: TablePaginationProps) {
  return (
    <Group justify="space-between" p="md">
      <Group gap="sm">
        <Text size="sm" c="dimmed">Por página:</Text>
        <Select
          data={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onChange={(value) => value && setPageSize(Number(value))}
          allowDeselect={false}
          disabled={disabled}
          w={80}
          size="xs"
          radius="md"
        />
        <Text size="sm" c="dimmed">
          {totalElements} registro(s) — página {page} de {totalPages}
        </Text>
      </Group>
      {totalPages > 1 && (
        <Pagination value={page} onChange={setPage} total={totalPages} disabled={disabled} radius="md" />
      )}
    </Group>
  );
}
