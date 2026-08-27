export type UserRole = 'USER' | 'SUPERADMIN'

// Forma de un usuario tal como lo devuelve el API.
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

// Lo que ENVIAMOS al API para iniciar sesión.
export interface LoginRequest {
  email: string
  password: string
}

// Lo que ENVIAMOS al API para registrarnos.
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

// Lo que RECIBIMOS del API tras un login o registro exitoso.
export interface AuthResponse {
  token: string
  user: User
}