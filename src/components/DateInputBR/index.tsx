// src/components/DateInputBR/index.tsx
import { DateInput } from '@mantine/dates';
import type { DateInputProps } from '@mantine/dates';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// DateInput mostra a data em dd/mm/yyyy (valueFormat), mas por padrão interpreta texto digitado com o
// Date() nativo do JS, que lê "10/09/2026" como mês/dia/ano (10 de setembro vira 9 de outubro). Esse
// parser garante que o texto digitado seja lido no mesmo formato dd/mm/yyyy exibido.
function parseBrDate(value: string) {
  const parsed = dayjs(value, 'DD/MM/YYYY', true);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
}

export function DateInputBR(props: Omit<DateInputProps, 'valueFormat' | 'dateParser'>) {
  return <DateInput valueFormat="DD/MM/YYYY" dateParser={parseBrDate} {...props} />;
}
