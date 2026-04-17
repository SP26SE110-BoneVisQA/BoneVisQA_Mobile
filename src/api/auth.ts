import { api } from './client';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../types/auth';

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/Auths/login', payload);
  return data;
}

export async function register(payload: RegisterRequest): Promise<void> {
  await api.post('/api/Auths/register', payload);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<void> {
  await api.post('/api/Auths/forgot-password', payload);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<void> {
  await api.post('/api/Auths/reset-password', payload);
}
