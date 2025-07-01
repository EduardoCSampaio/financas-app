import axios, { InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://romantic-trust-production.up.railway.app",
});

// Interceptor para adicionar o token de autenticação em cada requisição
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

export default api;

export async function getCategories(token?: string) {
  const res = await api.get('/categories/', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data;
}