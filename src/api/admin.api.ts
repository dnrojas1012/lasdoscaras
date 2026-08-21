import { apiClient } from './apiClient'
import type { User } from '../models/user.model'
import type { Category } from '../models/category.model'
import type { PoliticalView, ViewStatus } from '../models/view.model'
import type { Paginated } from '../models/api.model'

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }
  const query = search.toString()
  return query.length > 0 ? `?${query}` : ''
}

// El nombre de la propiedad es pageSize porque así lo declara la
// interfaz Paginated<T> del proyecto. Si el servidor responde con
// 'limit', la traducción ocurre acá y no en los componentes.
function normalize<T>(
  raw: unknown,
  key: string,
  page: number,
  pageSize: number,
): Paginated<T> {
  if (Array.isArray(raw)) {
    return { items: raw as T[], total: raw.length, page, pageSize }
  }

  const body = raw as Record<string, unknown>
  const items = (body[key] ?? body.items ?? body.data ?? []) as T[]

  return {
    items,
    total: Number(body.total ?? items.length),
    page: Number(body.page ?? page),
    pageSize: Number(body.pageSize ?? body.limit ?? pageSize),
  }
}

export const adminApi = {
  async listUsers(
    params: { search?: string; page?: number; pageSize?: number } = {},
  ): Promise<Paginated<User>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const raw = await apiClient.get<unknown>(
      `/admin/users${buildQuery({ ...params, page, pageSize })}`,
    )
    return normalize<User>(raw, 'users', page, pageSize)
  },

  banUser: (id: string): Promise<unknown> => apiClient.patch(`/admin/users/${id}/ban`),

  unbanUser: (id: string): Promise<unknown> => apiClient.patch(`/admin/users/${id}/unban`),

  async listCategories(): Promise<Category[]> {
    const raw = await apiClient.get<unknown>('/admin/categories')
    if (Array.isArray(raw)) return raw as Category[]
    const body = raw as Record<string, unknown>
    return (body.categories ?? body.items ?? []) as Category[]
  },

  createCategory: (data: { name: string }): Promise<unknown> =>
    apiClient.post('/admin/categories', data),

  updateCategory: (id: string, data: { name: string }): Promise<unknown> =>
    apiClient.put(`/admin/categories/${id}`, data),

  deleteCategory: (id: string): Promise<unknown> =>
    apiClient.delete(`/admin/categories/${id}`),

  async listViews(
    params: { status?: ViewStatus; page?: number; pageSize?: number } = {},
  ): Promise<Paginated<PoliticalView>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const raw = await apiClient.get<unknown>(
      `/admin/views${buildQuery({ ...params, page, pageSize })}`,
    )
    return normalize<PoliticalView>(raw, 'views', page, pageSize)
  },
}
