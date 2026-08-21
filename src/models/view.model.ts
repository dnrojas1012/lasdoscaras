import type { Source } from './source.model'
import type { Category } from './category.model'

// El API llama SIDE al Lado A (Postura)
// y COUNTERPART al Lado B (Contrapostura).
export type SideKind = 'SIDE' | 'COUNTERPART'

export type ViewStatus = 'PUBLISHED' | 'UNPUBLISHED'

export type ReactionType = 'LIKE' | 'DISLIKE'

// Una de las dos caras de una publicación.
export interface ViewSide {
    id: string
    // Opcional porque el API no siempre lo devuelve dentro de side/counterpart:
    // ya viene implícito en la propiedad donde está anidado.
    kind?: SideKind
    title: string
    description: string
    sources: Source[]
    // Contadores PROPIOS de este lado. El API expone rutas separadas
    // (/sides/a/like y /sides/b/like), así que cada lado lleva los suyos.
    likes: number
    dislikes: number
    // Qué reaccionó el usuario actual en ESTE lado. null si no reaccionó.
    myReaction?: ReactionType | null
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