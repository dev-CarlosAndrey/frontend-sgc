// Leitura padronizada dos erros da API (ProblemDetail, contrato seção 3.2).

interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string>;
}

const getProblem = (error: unknown): ProblemDetail | null => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  return data && typeof data === 'object' && !(data instanceof Blob) ? (data as ProblemDetail) : null;
};

const getStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } })?.response?.status;

// Mensagem amigável para exibir ao usuário.
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const status = getStatus(error);
  if (status === undefined) {
    return 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
  }

  const problem = getProblem(error);

  // 422: lista os erros de campo quando não houver um detail mais útil
  if (problem?.errors && Object.keys(problem.errors).length > 0) {
    return Object.values(problem.errors).join('\n');
  }

  if (problem?.detail) return problem.detail;
  if (status === 403) return 'Você não tem permissão para executar esta ação.';
  return fallback;
}

// Erros de validação por campo (422, `errors: { campo: mensagem }`).
export function getApiFieldErrors(error: unknown): Record<string, string> {
  return getProblem(error)?.errors ?? {};
}

interface FormLike {
  getValues: () => object;
  setErrors: (errors: Record<string, string>) => void;
}

// Mostra o erro no formulário: erros 422 vão para os campos correspondentes,
// o restante (regra de negócio, duplicidade, etc.) aparece em um alerta.
export function showFormApiError(form: FormLike, error: unknown, fallback: string) {
  console.error(fallback, error);

  const values = form.getValues();
  const fieldErrors = getApiFieldErrors(error);
  const known: Record<string, string> = {};
  const unknown: string[] = [];

  Object.entries(fieldErrors).forEach(([field, message]) => {
    if (field in values) known[field] = message;
    else unknown.push(message);
  });

  if (Object.keys(known).length > 0) form.setErrors(known);

  if (Object.keys(known).length === 0) {
    alert(getApiErrorMessage(error, fallback));
  } else if (unknown.length > 0) {
    alert(unknown.join('\n'));
  }
}

// Para ações fora de formulário (excluir, atribuir técnico, upload...).
export function alertApiError(error: unknown, fallback: string) {
  console.error(fallback, error);
  alert(getApiErrorMessage(error, fallback));
}
