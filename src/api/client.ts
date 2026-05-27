import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../constants/env';
import { useAuthStore } from '../stores/authStore';
import type { ApiError } from '../types/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.length > 0) {
    return data;
  }
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.error === 'string') {
      return record.error;
    }
    if (typeof record.detail === 'string') {
      return record.detail;
    }
    if (record.errors && typeof record.errors === 'object') {
      const firstMessages = Object.values(record.errors as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value): value is string => typeof value === 'string');
      if (firstMessages.length > 0) {
        return firstMessages.join('\n');
      }
    }
    if (typeof record.title === 'string') {
      return record.title;
    }
  }
  return fallback;
}

function toApiError(error: unknown): ApiError {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return error as ApiError;
  }
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status ?? 0;
    const responseData = axiosError.response?.data;
    const message = extractMessage(
      responseData,
      axiosError.message || 'Something went wrong',
    );
    const details =
      responseData && typeof responseData === 'object'
        ? (responseData as Record<string, unknown>)
        : undefined;
    return {
      status,
      code: axiosError.code,
      message,
      details,
    };
  }
  if (error instanceof Error) {
    return { status: 0, message: error.message };
  }
  return { status: 0, message: 'Something went wrong' };
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.status === 401) {
      const { logout } = useAuthStore.getState();
      try {
        await logout();
      } catch {
        // ignore — store reset still applied below
      }
    }
    return Promise.reject(apiError);
  },
);

export async function handleApiError(e: unknown): Promise<ApiError> {
  return toApiError(e);
}

export function isAuthError(e: unknown): boolean {
  if (e && typeof e === 'object' && 'status' in e) {
    const status = (e as { status: unknown }).status;
    return status === 401;
  }
  return false;
}
