import type { Source } from './source.model'
import type { Category } from './category.model'

// El API llama SIDE al Lado A (Postura)
// y COUNTERPART al Lado B (Contrapostura).
export type SideKind = 'SIDE' | 'COUNTERPART'

export type ViewStatus = 'PUBLISHED' | 'UNPUBLISHED'

// Una de las dos caras de una publicación.
export interface ViewSide {
    id: string
    kind: SideKind
    title: string
    description: string
    sources: Source[]
}

// Datos mínimos del autor que vienen dentro de una publicación.
export interface ViewAuthor {
    id: string
    name: string
}

export interface PoliticalView {
    id: string
    status: ViewStatus
    author: ViewAuthor
    category: Category
    side: ViewSide
    counterpart: ViewSide
    likes: number
    dislikes: number
    createdAt: string
}