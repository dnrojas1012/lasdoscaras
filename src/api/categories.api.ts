import { apiClient } from './apiClient'

import { cacheService, CACHE_KEYS, TTL } from '../services/cacheService'

import type { Category } from '../models/category.model'

function unwrapList(raw: unknown): Category[] {

  if (Array.isArray(raw)) return raw as Category[]

  const body = raw as Record<string, unknown>

  return (body.categories ?? body.items ?? body.data ?? []) as Category[]

}

export const categoriesApi = {

  // Lee del cache primero. Solo llama al API si el cache vencio o no existe.

  // Esto cumple el requisito de TTL de 1 hora para categorias.

  async list(forceRefresh = false): Promise<Category[]> {

    if (!forceRefresh) {

      const cached = cacheService.get<Category[]>(CACHE_KEYS.categories, TTL.categories)

      if (cached !== null) return cached

    }

    try {

      const fresh = unwrapList(await apiClient.get<unknown>('/categories'))

      cacheService.set<Category[]>(CACHE_KEYS.categories, fresh)

      return fresh

    } catch (error) {

      // Modo sin conexion: si el API falla pero hay algo guardado aunque

      // este vencido, se devuelve eso en vez de dejar la pantalla vacia.

      const stale = cacheService.getStale<Category[]>(CACHE_KEYS.categories)

      if (stale !== null) return stale

      throw error

    }

  },

  async getById(id: string): Promise<Category> {

    const raw = await apiClient.get<unknown>(`/categories/${id}`)

    const body = raw as Record<string, unknown>

    return (body.category ?? body) as Category

  },

}
