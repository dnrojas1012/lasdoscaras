import { apiClient } from './apiClient'
import type { PoliticalView } from '../models/view.model'
import type { Category } from '../models/category.model'
import type { Hashtag } from '../models/hashtag.model'
import type { User } from '../models/user.model'

export interface SearchResults {
  views: PoliticalView[]
  categories: Category[]
  hashtags: Hashtag[]
  users: User[]
}

export const searchApi = {
  async global(term: string): Promise<SearchResults> {
    const raw = await apiClient.get<unknown>(`/search?q=${encodeURIComponent(term)}`)
    const body = raw as Record<string, unknown>
    return {
      views: (body.views ?? []) as PoliticalView[],
      categories: (body.categories ?? []) as Category[],
      hashtags: (body.hashtags ?? []) as Hashtag[],
      users: (body.users ?? []) as User[],
    }
  },
}