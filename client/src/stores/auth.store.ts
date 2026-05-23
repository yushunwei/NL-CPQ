import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../api/client';
import router from '../router';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  function loadFromStorage() {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      token.value = savedToken;
      user.value = JSON.parse(savedUser);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    const redirect = data.user.role === 'ADMIN' ? '/admin/dashboard' : '/portal/products';
    router.push(redirect);
  }

  async function register(email: string, password: string, name: string) {
    const { data } = await api.post('/auth/register', { email, password, name });
    token.value = data.token;
    user.value = data.user;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    router.push('/portal/products');
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  loadFromStorage();

  return { user, token, login, register, logout, loadFromStorage };
});
