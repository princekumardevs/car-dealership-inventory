import api from './client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const register = (data: { name: string; email: string; password: string }) =>
  api.post<AuthResponse>('/auth/register', data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);
