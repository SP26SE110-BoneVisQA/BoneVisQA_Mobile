import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '../types/auth';
import { SECURE_STORE_KEYS } from '../constants/env';

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

async function persistToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_STORE_KEYS.token, token);
}

async function persistUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(
    SECURE_STORE_KEYS.user,
    JSON.stringify(user),
  );
}

async function clearPersisted(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.token),
    SecureStore.deleteItemAsync(SECURE_STORE_KEYS.user),
  ]);
}

export const useAuthStore = create<AuthState>((set) => ({
  token: 'mock-token',
  user: { 
    id: 'mock-id', 
    email: 'test@example.com', 
    fullName: 'Test User', 
    role: 'Student' 
  },
  isHydrated: true,
  isAuthenticated: true,
  login: async (token, user) => {
    await persistToken(token);
    await persistUser(user);
    set({ token, user, isAuthenticated: true });
  },
  logout: async () => {
    await clearPersisted();
    set({ token: null, user: null, isAuthenticated: false });
  },
  hydrate: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.token),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.user),
      ]);
      if (token && userJson) {
        const user = JSON.parse(userJson) as AuthUser;
        set({
          token,
          user,
          isAuthenticated: true,
          isHydrated: true,
        });
        return;
      }
      set({ isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },
  setUser: (user) => set({ user }),
}));
