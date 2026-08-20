export interface CommentAuthor {
    id: string
    name: string
}

export interface Comment {
    id: string
    content: string
    author: CommentAuthor
    // null cuando es un comentario de primer nivel;
    // lleva el id del comentario padre cuando es una respuesta.
    parentId: string | null
    createdAt: string
    replies?: Comment[]
}

export interface CommentThread {
    id: string
    title?: string
    comments: Comment[]
    createdAt: string
}