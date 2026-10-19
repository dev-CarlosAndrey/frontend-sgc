import { useEffect, useState } from 'react';
import { api } from '../services/api';

export interface SelectOption {
  value: string;
  label: string;
}

// Carrega as opções de um Select de filtro a partir de um cadastro (ex.: setores, categorias).
// Usa uma página grande de uma vez: são listas de apoio, não a listagem paginada da tela.
export function useSelectOptions<T extends { id: number }>(path: string, getLabel: (item: T) => string) {
  const [options, setOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(path, { params: { size: 1000, sort: 'name,asc' }, signal: controller.signal })
      .then((response) => {
        const content: T[] = Array.isArray(response.data?.content) ? response.data.content : [];
        setOptions(content.map((item) => ({ value: String(item.id), label: getLabel(item) })));
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(`Erro ao carregar opções de ${path}:`, error);
      });
    return () => controller.abort();
    // getLabel é uma função inline na tela; recarregar só quando o caminho muda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  return options;
}
