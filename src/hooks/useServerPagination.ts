import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export const PAGE_SIZE_OPTIONS = ['10', '20', '50'];

type FilterValue = string | number | boolean | null | undefined;

interface Options {
  // Ordenação no formato do Spring: "campo,asc" ou "campo,desc"
  sort?: string;
  initialPageSize?: number;
}

interface PageState<T> {
  key: string;
  items: T[];
  totalPages: number;
  totalElements: number;
  error: boolean;
}

// Paginação no servidor (contrato, seção 3.1): envia page/size/sort e os filtros
// como query string e lê o envelope { content, page: { totalPages, totalElements } }.
// Filtros vazios (null, undefined, '') não são enviados. A página volta para 1
// sempre que algum filtro muda.
export function useServerPagination<T>(path: string, filters: Record<string, FilterValue> = {}, options: Options = {}) {
  const { sort, initialPageSize = 10 } = options;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState<PageState<T>>({ key: '', items: [], totalPages: 1, totalElements: 0, error: false });

  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([name, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === 'string' && value.trim() === '') return;
    params[name] = typeof value === 'string' ? value.trim() : value;
  });
  const filtersKey = JSON.stringify(params);

  // Filtro mudou: volta para a primeira página (ajuste de estado durante o render, sem effect)
  const [lastFiltersKey, setLastFiltersKey] = useState(filtersKey);
  if (lastFiltersKey !== filtersKey) {
    setLastFiltersKey(filtersKey);
    setPage(1);
  }

  const requestKey = JSON.stringify([path, filtersKey, page, pageSize, sort, reloadCount]);

  useEffect(() => {
    const controller = new AbortController();
    const query = { ...JSON.parse(filtersKey), page: page - 1, size: pageSize, ...(sort ? { sort } : {}) };

    api
      .get(path, { params: query, signal: controller.signal })
      .then((response) => {
        const content: T[] = Array.isArray(response.data?.content) ? response.data.content : [];
        const meta = response.data?.page ?? {};
        const totalPages = Math.max(meta.totalPages ?? 1, 1);

        // Ex.: excluiu o último item da última página — volta para a página que ainda existe
        if (content.length === 0 && page > totalPages) {
          setPage(totalPages);
          return;
        }

        setData({ key: requestKey, items: content, totalPages, totalElements: meta.totalElements ?? content.length, error: false });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(`Erro ao buscar ${path}:`, error);
        setData((previous) => ({ ...previous, key: requestKey, error: true }));
      });

    return () => controller.abort();
  }, [path, filtersKey, page, pageSize, sort, requestKey]);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return {
    items: data.items,
    loading: data.key !== requestKey,
    // true até a primeira resposta chegar (útil para mostrar o loader de tela cheia)
    initialLoading: data.key === '',
    error: data.error,
    page,
    pageSize,
    totalPages: data.totalPages,
    totalElements: data.totalElements,
    setPage,
    setPageSize,
    reload,
  };
}
