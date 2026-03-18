import { create } from 'zustand';
import type { UserResponse } from '../api/profiles';

export type ActiveRole = 'individual' | 'organization';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  activeRole: ActiveRole | null;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserResponse) => void;
  setActiveRole: (role: ActiveRole) => void;
  logout: () => void;
}

function parseActiveRole(token: string): ActiveRole | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.active_role === 'individual' || payload.active_role === 'organization') {
      return payload.active_role;
    }
  } catch {
    // ignore
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: localStorage.getItem('refresh_token'),
  user: null,
  activeRole: (localStorage.getItem('active_role') as ActiveRole) || null,
  isAuthenticated: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('refresh_token', refreshToken);
    const activeRole = parseActiveRole(accessToken);
    if (activeRole) {
      localStorage.setItem('active_role', activeRole);
    }
    set({ accessToken, refreshToken, isAuthenticated: true, activeRole });
  },

  setUser: (user) => set({ user }),

  setActiveRole: (role) => {
    localStorage.setItem('active_role', role);
    set({ activeRole: role });
  },

  logout: () => {
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_role');
    set({ accessToken: null, refreshToken: null, user: null, activeRole: null, isAuthenticated: false });
  },
}));
