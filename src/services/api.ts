import axios from 'axios';

// Sem Content-Type fixo: o axios define sozinho (JSON para objetos, multipart para FormData).
// Fixar 'application/json' aqui fazia os uploads (FormData) serem convertidos em JSON.
export const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

export const SESSION_EXPIRED_EVENT = 'sgc:session-expired';

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@SGC:token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// O backend responde 403 nos dois casos abaixo (contrato, seções 2.2 e 3.2):
// - token ausente/inválido/expirado: 403 SEM corpo;
// - autenticado mas sem permissão: 403 COM ProblemDetail (type .../errors/access-denied).
// Só o primeiro caso significa sessão expirada.
const hasProblemDetailBody = (data: unknown) => {
  if (data instanceof Blob) return data.size > 0;
  return typeof (data as { type?: unknown })?.type === 'string';
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes('/auth/login');

    if (
      status === 403 &&
      !isLoginRequest &&
      localStorage.getItem('@SGC:token') &&
      !hasProblemDetailBody(error.response?.data)
    ) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);
