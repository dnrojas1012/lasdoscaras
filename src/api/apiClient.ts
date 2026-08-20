import { cacheService, CACHE_KEYS } from '../services/cacheService'

import type { User } from '../models/user.model'

// Se lee una sola vez del archivo .env.

// Si mañana cambia la dirección del servidor, se cambia en un solo lugar.

const BASE_URL = import.meta.env.VITE_API_URL

// =====================================================================

// TIPOS DE ERROR PROPIOS

// =====================================================================

// Se crean clases de error propias para poder distinguir, más arriba en la

// aplicación, si lo que falló fue la red o si el servidor respondió con un

// error. Son situaciones distintas y merecen mensajes distintos.

export class ApiError extends Error {
  public readonly status: number

  // Errores por campo, para pintarlos junto al input que corresponde.
  // Ejemplo: { email: 'El correo ya está registrado' }
  public readonly fieldErrors: Record<string, string>

  constructor(
    status: number,
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {

  constructor(

    message = 'No fue posible conectar con el servidor. Verifique su conexión e intente de nuevo.',

  ) {

    super(message)

    this.name = 'NetworkError'

  }

}

// =====================================================================

// MANEJADOR DE SESIÓN EXPIRADA

// =====================================================================

// Este archivo necesita avisar cuando llega un 401, pero NO puede importar

// el store de sesión de Luis Carlos: ese store importa este archivo, y si

// este importara el store, cada uno esperaría al otro y la aplicación no

// arrancaría. Se llama "importación circular".

//

// La solución es dejar un gancho: el store registra acá su función de cierre

// de sesión al arrancar la app, y este archivo solo la ejecuta.

type UnauthorizedHandler = () => void

let onUnauthorized: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {

  onUnauthorized = handler

}

// =====================================================================

// LECTURA DEL TOKEN

// =====================================================================

interface StoredAuth {

  token: string

  user: User

}

function getToken(): string | null {

  const auth = cacheService.get<StoredAuth>(CACHE_KEYS.auth)

  // ?. evita el error si auth es null.

  // ?? devuelve null si lo de la izquierda es null o undefined.

  return auth?.token ?? null

}

// =====================================================================

// MENSAJES POR CÓDIGO HTTP

// =====================================================================

// Cada código produce un mensaje pensado para el usuario final.

// El enunciado prohíbe expresamente mostrar la excepción técnica cruda.

const HTTP_MESSAGES: Record<number, string> = {

  400: 'Los datos enviados no son válidos. Revise el formulario.',

  401: 'Su sesión ha expirado.',

  403: 'No tiene permiso para realizar esta acción.',

  404: 'El recurso solicitado no existe.',

  409: 'El recurso ya existe.',

  422: 'Los datos enviados no pudieron ser procesados.',

  500: 'Ocurrió un error en el servidor. Intente más tarde.',

  502: 'Ocurrió un error en el servidor. Intente más tarde.',

  503: 'Ocurrió un error en el servidor. Intente más tarde.',

}

// =====================================================================

// ERRORES POR CAMPO

// =====================================================================

// El API valida con Zod. Según la versión, el cuerpo del error puede venir

// en varias formas. Esta función prueba las dos más comunes y devuelve un

// objeto simple { campo: mensaje }.

function extractFieldErrors(payload: unknown): Record<string, string> {

  const result: Record<string, string> = {}

  if (typeof payload !== 'object' || payload === null) return result

  const body = payload as Record<string, unknown>

  // Forma A: { issues: [{ path: ['email'], message: '...' }] }

  const issues = body.issues ?? body.errors

  if (Array.isArray(issues)) {

    for (const issue of issues) {

      if (typeof issue !== 'object' || issue === null) continue

      const item = issue as Record<string, unknown>

      const path = Array.isArray(item.path) ? item.path : []

      const field = path.length > 0 ? String(path[path.length - 1]) : 'general'

      result[field] = String(item.message ?? 'Dato inválido')

    }

    return result

  }

  // Forma B: { fieldErrors: { email: ['...'] } }

  const fieldErrors = body.fieldErrors

  if (typeof fieldErrors === 'object' && fieldErrors !== null) {

    for (const [field, value] of Object.entries(fieldErrors)) {

      result[field] = Array.isArray(value) ? String(value[0]) : String(value)

    }

  }

  return result

}

// =====================================================================

// LA FUNCIÓN CENTRAL

// =====================================================================

interface RequestOptions {

  // Si es true y falla por red, reintenta una vez. Se activa solo en GET.

  retry?: boolean

}

async function request<T>(

  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',

  path: string,

  body?: unknown,

  options: RequestOptions = {},

): Promise<T> {

  const headers: Record<string, string> = {

    'Content-Type': 'application/json',

  }

  // El token se agrega en un solo lugar, para toda la aplicación.

  const token = getToken()

  if (token !== null) {

    headers.Authorization = `Bearer ${token}`

  }

  let response: Response

  try {

    response = await fetch(`${BASE_URL}${path}`, {

      method,

      headers,

      body: body === undefined ? undefined : JSON.stringify(body),

    })

  } catch {

    // Solo se entra acá si NO hubo respuesta del servidor:

    // sin internet, servidor apagado, DNS caído.

    // Un 404 o un 500 NO caen acá: eso sí es una respuesta.

    if (options.retry === true) {

      // El reintento automático que exige el enunciado.

      // Espera medio segundo antes de volver a intentar, una sola vez.

      await new Promise((resolve) => setTimeout(resolve, 500))

      return request<T>(method, path, body, { retry: false })

    }

    throw new NetworkError()

  }

  // 204 significa "operación exitosa, sin contenido de respuesta".

  if (response.status === 204) {

    return undefined as T

  }

  // Se intenta leer el cuerpo. Algunos errores vienen sin cuerpo.

  let payload: unknown = null

  try {

    payload = await response.json()

  } catch {

    payload = null

  }

  if (response.ok) {

    return payload as T

  }

  // A partir de acá, el servidor respondió con un error.

  const status = response.status

  const fieldErrors =

    status === 400 || status === 409 || status === 422

      ? extractFieldErrors(payload)

      : {}

  // Se prefiere el mensaje que mande el servidor; si no hay, el genérico nuestro.

  const serverMessage =

    typeof payload === 'object' && payload !== null && 'message' in payload

      ? String((payload as Record<string, unknown>).message)

      : null

  const message = serverMessage ?? HTTP_MESSAGES[status] ?? 'Ocurrió un error inesperado.'

  if (status === 401) {

    // Sesión expirada o token inválido: se limpia la sesión del caché

    // y se avisa a quien haya registrado el manejador.

    cacheService.remove(CACHE_KEYS.auth)

    if (onUnauthorized !== null) onUnauthorized()

  }

  if (status >= 500) {

    // El enunciado pide registrar el error en consola para depuración.

    console.error(`Error ${status} del servidor en ${method} ${path}:`, payload)

  }

  throw new ApiError(status, message, fieldErrors)

}

// =====================================================================

// ATAJOS

// =====================================================================

// Solo los GET reintentan, porque repetir un POST podría crear

// dos publicaciones o dos usuarios.

export const apiClient = {

  get: <T>(path: string): Promise<T> => request<T>('GET', path, undefined, { retry: true }),

  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),

  put: <T>(path: string, body?: unknown): Promise<T> => request<T>('PUT', path, body),

  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),

  delete: <T>(path: string): Promise<T> => request<T>('DELETE', path),

}
