import { apiClient } from './apiClient'
import type { PoliticalView } from '../models/view.model'
import type { Paginated } from '../models/api.model'
import type { ViewSide, SideKind } from '../models/view.model'
import type { Source } from '../models/source.model'


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

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    const nombreReal = key === 'pageSize' ? 'limit' : key
    search.append(nombreReal, String(value))
  }

  const query = search.toString()
  return query.length > 0 ? `?${query}` : ''

}

// Convierte UN lado crudo del API (con likeCount/dislikeCount y type)
// a la forma que usa la app (con likes/dislikes y kind).
function normalizeSide(raw: Record<string, unknown>): ViewSide {
  return {
    id: String(raw.id),
    kind: raw.type as SideKind,
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    sources: (raw.sources ?? []) as Source[],
    likes: Number(raw.likeCount ?? 0),
    dislikes: Number(raw.dislikeCount ?? 0),
    myReaction: (raw.myReaction ?? null) as ViewSide['myReaction'],
  }
}

const EMPTY_SIDE: ViewSide = {
  id: '', title: '', description: '', sources: [], likes: 0, dislikes: 0, myReaction: null,
}

// El API devuelve un arreglo 'sides' con dos elementos distinguidos por
// 'type': SIDE o COUNTERPART. La app trabaja con dos propiedades separadas,
// 'side' y 'counterpart', porque es como la consumen todos los componentes.
// Esta funcion hace esa traduccion en un solo lugar.
function normalizeView(raw: unknown): PoliticalView {
  const outer = raw as Record<string, unknown>
  const b = (outer.view ?? outer) as Record<string, unknown>
  const sidesArr = (b.sides ?? []) as Array<Record<string, unknown>>
  const sideRaw = sidesArr.find((s) => s.type === 'SIDE')
  const counterpartRaw = sidesArr.find((s) => s.type === 'COUNTERPART')

  return {
    id: String(b.id),
    status: b.status as PoliticalView['status'],
    author: b.author as PoliticalView['author'],
    category: b.category as PoliticalView['category'],
    side: sideRaw ? normalizeSide(sideRaw) : EMPTY_SIDE,
    counterpart: counterpartRaw ? normalizeSide(counterpartRaw) : EMPTY_SIDE,
    hashtags: (b.hashtags ?? []) as PoliticalView['hashtags'],
    createdAt: String(b.createdAt),
    updatedAt: b.updatedAt ? String(b.updatedAt) : undefined,
  }
}

function normalizeList(raw: unknown, page: number, pageSize: number): Paginated<PoliticalView> {
  const body = raw as Record<string, unknown>
  const rawItems = Array.isArray(raw) ? raw : ((body.views ?? body.items ?? body.data ?? []) as unknown[])
  const items = rawItems.map((item) => normalizeView(item))
  return {
    items,
    total: Array.isArray(raw) ? items.length : Number(body.total ?? items.length),
    page: Array.isArray(raw) ? page : Number(body.page ?? page),
    pageSize: Array.isArray(raw) ? pageSize : Number(body.limit ?? pageSize),
  }
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
    return normalizeView(raw)
  },

  async create(payload: ViewPayload): Promise<PoliticalView> {
    const raw = await apiClient.post<unknown>('/views', payload)
    return normalizeView(raw)
  },

  async update(id: string, payload: ViewPayload): Promise<PoliticalView> {
    const raw = await apiClient.put<unknown>(`/views/${id}`, payload)
    return normalizeView(raw)
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