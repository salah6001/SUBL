import { api } from './client';
import type {
  AuthResponse,
  LoginRequest,
  SignUpRequest,
  ForgotPasswordRequest,
  VerifyCodeRequest,
  ResetPasswordRequest,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data),
  signup: (data: SignUpRequest) => api.post<AuthResponse>('/auth/register', data),
  forgotPassword: (data: ForgotPasswordRequest) => api.post<{ message: string }>('/auth/forgot-password', data),
  verifyCode: (data: VerifyCodeRequest) => api.post<{ message: string }>('/auth/verify-code', data),
  resetPassword: (data: ResetPasswordRequest) => api.post<{ message: string }>('/auth/reset-password', data),
};
