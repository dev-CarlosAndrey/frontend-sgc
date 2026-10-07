export const buildQuery = (entries: Record<string, string | number | null | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(entries).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const formatCurrency = (value: number | null | undefined) =>
  value == null ? '-' : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatHours = (value: number | null | undefined) => (value == null ? '-' : `${value} h`);
