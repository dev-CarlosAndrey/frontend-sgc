import { useState } from 'react';

export const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

// Paginação client-side sobre a lista já filtrada
export function usePagination<T>(items: T[], initialPageSize = 10) {
  const [requestedPage, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);
  // Se a busca reduzir a lista, evita ficar numa página que não existe mais
  const page = Math.min(requestedPage, totalPages);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    setPage(1);
  };

  return { pageItems, page, pageSize, totalPages, totalElements: items.length, setPage, setPageSize };
}
