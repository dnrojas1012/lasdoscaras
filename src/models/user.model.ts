// Los dos únicos roles que maneja el API.
// Al escribirlo como unión de textos literales, TypeScript solo acepta
// exactamente esos dos valores. Si alguien escribe 'ADMIN' por error,
// el editor lo marca antes de ejecutar.
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
// 'user' lleva signo de interrogación porque puede que el API devuelva
// solo el token. Si en el paso 1.1 confirmaste que siempre viene el
// usuario, se le puede quitar el '?'.
export interface AuthResponse {
  token: string
  user: User
}