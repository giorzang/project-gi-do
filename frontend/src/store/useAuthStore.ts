import { create } from 'zustand';
import type { User } from '../types/common';
import api from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      // Gọi API /me đã viết ở Backend
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isLoading: false });
    } catch (error) {
      set({ user: null, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ user: null });
    // Tùy chọn: Gọi API logout nếu thích
  }
}));