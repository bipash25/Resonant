import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    
    login: (user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    
    updateUser: (updates) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...updates };
        localStorage.setItem('user', JSON.stringify(updated));
        return { user: updated };
      });
    }
  };
});
