import { apiClient } from './apiClient'
import type { PoliticalView } from '../models/view.model'
import type { Paginated } from '../models/api.model'

// Parámetros de filtrado del tablero.
// Nota: el nombre del parámetro de tamaño de página se mantiene como
// pageSize porque así lo declara la interfaz Paginated<T> del proyecto.
// Si el API resultara aceptar 'limit', se cambia únicamente en buildQuery.
export interface ViewsQuery {
  category?: string
  hashtag?: string
  sort?: 'recent' | 'likes' | 'dislikes'
  page?: number
  pageSize?: number
  autorId?: string
  autor?: 'me'
}

export interface SideInput {
  title: string
  description: string
  sources: Array<{ type: 'LINK' | 'YOUTUBE' | 'DOCUMENT'; url: string; label?: string }>
}

export interface ViewPayload {
  categoryId: string
  side: SideInput
  counterpart: SideInput
  hashtags: string[]
}

// 'a' es la Postura (Lado A), 'b' la Contrapostura (Lado B).
export type SideKey = 'a' | 'b'

// Convierte el objeto de filtros en la cadena ?clave=valor de la URL.
// Se omiten los valores vacíos para no mandar parámetros inútiles.
function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }
  const query = search.toString()
  return query.length > 0 ? `?${query}` : ''
}

// El API puede devolver la lista envuelta de varias formas.
// Este normalizador acepta las tres más comunes y siempre entrega la
// misma estructura, así ningún componente tiene que preocuparse por eso.
function normalizeList(
  raw: unknown,
  page: number,
  pageSize: number,
): Paginated<PoliticalView> {
  if (Array.isArray(raw)) {
    return { items: raw as PoliticalView[], total: raw.length, page, pageSize }
  }

  const body = raw as Record<string, unknown>
  const items = (body.views ?? body.items ?? body.data ?? []) as PoliticalView[]

  return {
    items,
    total: Number(body.total ?? items.length),
    page: Number(body.page ?? page),
    // Se acepta pageSize o limit según cómo responda el servidor.
    pageSize: Number(body.pageSize ?? body.limit ?? pageSize),
  }
}

function unwrapView(raw: unknown): PoliticalView {
  const body = raw as Record<string, unknown>
  // Las respuestas de creación vienen como { view: {...} }.
  return (body.view ?? body) as PoliticalView
}

export const viewsApi = {
  async list(query: ViewsQuery = {}): Promise<Paginated<PoliticalView>> {
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 12
    const raw = await apiClient.get<unknown>(
      `/views${buildQuery({ ...query, page, pageSize })}`,
    )
    return normalizeList(raw, page, pageSize)
  },

  async getById(id: string): Promise<PoliticalView> {
    const raw = await apiClient.get<unknown>(`/views/${id}`)
    return unwrapView(raw)
  },

  async create(payload: ViewPayload): Promise<PoliticalView> {
    const raw = await apiClient.post<unknown>('/views', payload)
    return unwrapView(raw)
  },

  async update(id: string, payload: ViewPayload): Promise<PoliticalView> {
    const raw = await apiClient.put<unknown>(`/views/${id}`, payload)
    return unwrapView(raw)
  },

  // Reacciones INDEPENDIENTES por lado. 'a' es la Postura, 'b' la Contrapostura.
  // Dar like estando en dislike cambia la reacción; darlo dos veces no hace nada.
  react: (id: string, side: SideKey, type: 'like' | 'dislike'): Promise<unknown> =>
    apiClient.post(`/views/${id}/sides/${side}/${type}`),

  addFavorite: (id: string): Promise<unknown> =>
    apiClient.post(`/views/${id}/favorite`),

  removeFavorite: (id: string): Promise<unknown> =>
    apiClient.delete(`/views/${id}/favorite`),

  publish: (id: string): Promise<unknown> =>
    apiClient.patch(`/views/${id}/publish`),

  unpublish: (id: string): Promise<unknown> =>
    apiClient.patch(`/views/${id}/unpublish`),
}