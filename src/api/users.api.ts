import { apiClient } from './apiClient'
import type { User } from '../models/user.model'
import type { PoliticalView } from '../models/view.model'

export interface AuthorProfile {
  user: User
  views: PoliticalView[]
}

export const usersApi = {
  // Devuelve un arreglo de ids de publicaciones favoritas.
  async myFavorites(): Promise<string[]> {
    const raw = await apiClient.get<unknown>('/users/me/favorites')
    if (Array.isArray(raw)) {
      // Puede venir como ['id1','id2'] o como [{ politicalViewId: 'id1' }]
      return raw.map((item) =>
        typeof item === 'string' ? item : String((item as Record<string, unknown>).politicalViewId),
      )
    }
    const body = raw as Record<string, unknown>
    const list = (body.favorites ?? body.items ?? []) as unknown[]
    return list.map((item) =>
      typeof item === 'string' ? item : String((item as Record<string, unknown>).politicalViewId),
    )
  },

  async getAuthor(id: string): Promise<AuthorProfile> {
    const raw = await apiClient.get<unknown>(`/authors/${id}`)
    const body = raw as Record<string, unknown>
    return {
      user: (body.user ?? body.author ?? body) as User,
      views: (body.views ?? []) as PoliticalView[],
    }
  },
}