// Forma genérica de una lista paginada.

//

// El <T> es un "hueco" que se rellena al momento de usar la interfaz:

//   Paginated<PoliticalView>  →  una lista paginada de publicaciones

//   Paginated<User>           →  una lista paginada de usuarios

//

// Sin genéricos habría que escribir PaginatedViews, PaginatedUsers,

// PaginatedCategories... todas idénticas salvo por un campo.

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
