import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : 'https://skillitracker.onrender.com/api'; // fallback

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('st_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Response interceptor
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('st_token');
      localStorage.removeItem('st_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;