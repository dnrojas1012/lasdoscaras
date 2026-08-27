import { apiClient } from './apiClient'
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model'

export const authApi = {
  // Las cuentas nuevas nacen en estado PENDING y no pueden iniciar sesion
  // hasta activarse con el token que devuelve el registro. 
  activate: (activationToken: string): Promise<unknown> =>
    apiClient.get(`/auth/activate/${activationToken}`),

  login: (data: LoginRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/register', data),

  me: (): Promise<User> => apiClient.get<User>('/auth/me'),
}