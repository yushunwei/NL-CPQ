import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || '请求失败';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/login');
    }
    ElMessage.error(msg);
    return Promise.reject(err);
  }
);

export default api;
