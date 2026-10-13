import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const TOKEN_KEY = 'el_token';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 20000 });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Turns every failure into { message, status, fieldErrors } so screens can show friendly text. */
export function normalizeError(error) {
  if (error?.normalized) return error;
  let status = error?.response?.status ?? 0;
  const data = error?.response?.data;
  let message;
  if (!error?.response) {
    message = error?.code === 'ECONNABORTED'
      ? 'The server took too long to respond. Please try again.'
      : 'Cannot reach the EmergencyLink server. Check that the backend is running and try again.';
  } else if (data && typeof data === 'object' && data.message) {
    message = data.message;
  } else if (status === 401) message = 'Please sign in again.';
  else if (status === 403) message = 'Your role is not permitted to do that.';
  else if (status === 404) message = 'We could not find what you asked for.';
  else message = 'Something went wrong. Please try again.';
  const e = new Error(message);
  e.normalized = true;
  e.status = status;
  e.fieldErrors = data?.fieldErrors || {};
  return e;
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error?.config?.url || '';
    if (error?.response?.status === 401 && !url.includes('/api/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new CustomEvent('el:unauthorized'));
    }
    return Promise.reject(normalizeError(error));
  },
);

export default client;
