import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

const STORAGE_KEY = 'BONEVISQA_SETTINGS';

export type AppLanguage = 'vi' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';

export interface SettingsState {
  language: AppLanguage;
  theme: AppTheme;
  isHydrated: boolean;
  setLanguage: (l: AppLanguage) => Promise<void>;
  setTheme: (t: AppTheme) => Promise<void>;
  hydrate: () => Promise<void>;
}

interface PersistedSettings {
  language: AppLanguage;
  theme: AppTheme;
}

async function readPersisted(): Promise<PersistedSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>;
    const language: AppLanguage = parsed.language === 'en' ? 'en' : 'vi';
    const theme: AppTheme =
      parsed.theme === 'dark' || parsed.theme === 'light'
        ? parsed.theme
        : 'system';
    return { language, theme };
  } catch {
    return null;
  }
}

async function writePersisted(value: PersistedSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore — persistence is best-effort
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'vi',
  theme: 'system',
  isHydrated: false,
  setLanguage: async (l) => {
    set({ language: l });
    await writePersisted({ language: l, theme: get().theme });
    try {
      await i18n.changeLanguage(l);
    } catch {
      // ignore — i18next may not be ready in tests
    }
  },
  setTheme: async (t) => {
    set({ theme: t });
    await writePersisted({ language: get().language, theme: t });
  },
  hydrate: async () => {
    const persisted = await readPersisted();
    if (persisted) {
      set({
        language: persisted.language,
        theme: persisted.theme,
        isHydrated: true,
      });
      try {
        await i18n.changeLanguage(persisted.language);
      } catch {
        // ignore
      }
      return;
    }
    set({ isHydrated: true });
  },
}));
