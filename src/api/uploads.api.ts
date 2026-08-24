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
    return String(body.url ?? '')
  },
}