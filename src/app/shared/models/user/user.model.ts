export type UserRole = 'Administrador' | 'Cliente';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}
