import Constants from 'expo-constants';

interface ExpoExtra {
  apiBaseUrl?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const API_BASE_URL: string =
  extra.apiBaseUrl ?? 'https://bonevisqa.onrender.com';

export const REQUEST_TIMEOUT_MS = 45_000;

export const SECURE_STORE_KEYS = {
  token: 'BONEVISQA_TOKEN',
  user: 'BONEVISQA_USER',
} as const;
