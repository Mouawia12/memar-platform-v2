import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AuthUser } from '../types/api';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: () => boolean;
  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

/**
 * حالة المصادقة — تُحفظ في localStorage (توكن + بيانات المستخدم).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: () => Boolean(get().token),
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'memar_auth' },
  ),
);
