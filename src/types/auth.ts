export type UserRole = 'Student';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string | null;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  token: string | null;
  requiresMedicalVerification: boolean;
  roles: string[] | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}
