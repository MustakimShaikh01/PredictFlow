import { create } from 'zustand';
import api from '../lib/api';

interface User { _id: string; name: string; email: string; role: string; department?: string; performanceScore: number; tasksCompleted: number; }
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: data.user, token: data.token, loading: false });
    } finally { set({ loading: false }); }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      set({ user: data.user, token: data.token, loading: false });
    } finally { set({ loading: false }); }
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/users/me');
      set({ user: data.user });
    } catch { localStorage.clear(); set({ user: null, token: null }); }
  },
}));
