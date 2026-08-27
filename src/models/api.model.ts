export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

// Los dos tipos de reacción que acepta el API.
// Al escribirlo como unión de textos literales, TypeScript solo permite
// exactamente esos dos valores.

export type ReactionType = 'LIKE' | 'DISLIKE'
