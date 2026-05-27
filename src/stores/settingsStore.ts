import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'BONEVISQA_SETTINGS';

export type AppTheme = 'light' | 'dark' | 'system';

export interface SettingsState {
  theme: AppTheme;
  isHydrated: boolean;
  setTheme: (t: AppTheme) => Promise<void>;
  hydrate: () => Promise<void>;
}

interface PersistedSettings {
  theme: AppTheme;
}

async function readPersisted(): Promise<PersistedSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const theme: AppTheme =
      parsed.theme === 'dark' || parsed.theme === 'light'
        ? parsed.theme
        : 'system';
    return { theme };
  } catch {
    return null;
  }
}

async function writePersisted(value: PersistedSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore - persistence is best-effort
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  isHydrated: false,
  setTheme: async (theme) => {
    set({ theme });
    await writePersisted({ theme });
  },
  hydrate: async () => {
    const persisted = await readPersisted();
    if (persisted) {
      set({
        theme: persisted.theme,
        isHydrated: true,
      });
      return;
    }
    set({ isHydrated: true });
  },
}));
