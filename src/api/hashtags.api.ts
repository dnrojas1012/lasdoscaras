import { apiClient } from './apiClient'
import { cacheService, CACHE_KEYS, TTL } from '../services/cacheService'
import type { Hashtag } from '../models/hashtag.model'

function unwrapList(raw: unknown): Hashtag[] {
  if (Array.isArray(raw)) return raw as Hashtag[]
  const body = raw as Record<string, unknown>
  return (body.hashtags ?? body.items ?? body.data ?? []) as Hashtag[]
}

export const hashtagsApi = {
  async list(search?: string): Promise<Hashtag[]> {
    // Solo se cachea la lista completa, no las busquedas puntuales.
    if (search === undefined || search === '') {
      const cached = cacheService.get<Hashtag[]>(CACHE_KEYS.hashtags, TTL.hashtags)
      if (cached !== null) return cached
    }
    const path = search ? `/hashtags?q=${encodeURIComponent(search)}` : '/hashtags'
    try {
      const fresh = unwrapList(await apiClient.get<unknown>(path))
      if (!search) cacheService.set<Hashtag[]>(CACHE_KEYS.hashtags, fresh)
      return fresh
    } catch (error) {
      const stale = cacheService.getStale<Hashtag[]>(CACHE_KEYS.hashtags)
      if (stale !== null) return stale
      throw error
    }
  },
}