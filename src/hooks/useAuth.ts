import { useMutation } from '@tanstack/react-query';
import * as authApi from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import type {
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '../types/auth';
import type { ApiError } from '../types/api';

export function useAuth(): {
  token: string | null;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAuthenticated: boolean;
  isHydrated: boolean;
} {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  return { token, user, isAuthenticated, isHydrated };
}

interface LoginSuccess {
  token: string;
  user: AuthUser;
}

function toLoginSuccess(response: LoginResponse): LoginSuccess {
  if (
    !response.success ||
    !response.token ||
    !response.userId ||
    !response.email
  ) {
    const error: ApiError = {
      status: 401,
      message: response.message ?? 'Login failed',
    };
    throw error;
  }
  return {
    token: response.token,
    user: {
      id: response.userId,
      email: response.email,
      fullName: response.fullName ?? response.email,
      role: 'Student',
    },
  };
}

export function useLogin() {
  const setLogin = useAuthStore((s) => s.login);
  return useMutation<LoginSuccess, ApiError, LoginRequest>({
    mutationFn: async (payload) => {
      const response = await authApi.login(payload);
      return toLoginSuccess(response);
    },
    onSuccess: async (data) => {
      await setLogin(data.token, data.user);
    },
  });
}

export function useRegister() {
  return useMutation<void, ApiError, RegisterRequest>({
    mutationFn: (payload) => authApi.register(payload),
  });
}

export function useForgotPassword() {
  return useMutation<void, ApiError, ForgotPasswordRequest>({
    mutationFn: (payload) => authApi.forgotPassword(payload),
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      await logout();
    },
  });
}
