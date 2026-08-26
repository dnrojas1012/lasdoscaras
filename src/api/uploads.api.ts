import { apiClient } from './apiClient'

// Tipos que el API acepta, segun su documentacion.
const TIPOS_PERMITIDOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

// 20 MB, el maximo que declara el API.
const MAX_BYTES = 20 * 1024 * 1024

export interface UploadResult {
  url: string
}

export const uploadsApi = {
  // Valida en el cliente ANTES de subir. Sin esto, el usuario espera
  // a que el archivo viaje completo solo para recibir un rechazo.
  validate(file: File): string | null {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      return 'Solo se permiten archivos PDF, Word o texto plano.'
    }
    if (file.size > MAX_BYTES) {
      return 'El archivo no puede superar los 20 MB.'
    }
    return null
  },

async document(file: File): Promise<string> {
    const raw = await apiClient.upload<unknown>('/uploads/document', file)
    const body = raw as Record<string, unknown>
    const ruta = String(body.url ?? '')

    // El API devuelve una ruta relativa (/uploads/archivo.docx), pero el
    // campo de la fuente se valida con Zod como URL completa (debe empezar
    // con http:// o https://). Si ya viene absoluta no se toca; si viene
    // relativa, se completa con el origen del servidor.
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
        return ruta
    }

    // import.meta.env.VITE_API_URL es algo como http://localhost:3000/api.
    // Se quita el sufijo /api para quedarse con el origen del servidor,
    // porque /uploads/... no vive bajo /api.
    const origen = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    return `${origen}${ruta}`
},
}