import { apiClient } from './apiClient'
import type { CommentThread, Comment } from '../models/comment.model'

// El API puede envolver la lista de distintas formas segun el endpoint.
// Estas dos funciones normalizan esa respuesta a un arreglo simple, para
// que el resto de la aplicacion no tenga que averiguar la forma real.
function unwrapThreads(raw: unknown): CommentThread[] {
  if (Array.isArray(raw)) return raw as CommentThread[]
  const body = raw as Record<string, unknown>
  return (body.threads ?? body.items ?? []) as CommentThread[]
}

function unwrapComments(raw: unknown): Comment[] {
  if (Array.isArray(raw)) return raw as Comment[]
  const body = raw as Record<string, unknown>
  return (body.comments ?? body.items ?? []) as Comment[]
}

export const commentsApi = {
  listThreads: async (viewId: string): Promise<CommentThread[]> =>
    unwrapThreads(await apiClient.get<unknown>(`/views/${viewId}/threads`)),

  createThread: (viewId: string, data: { title?: string; content: string }): Promise<unknown> =>
    apiClient.post(`/views/${viewId}/threads`, data),

  listComments: async (viewId: string, threadId: string): Promise<Comment[]> =>
    unwrapComments(await apiClient.get<unknown>(`/views/${viewId}/threads/${threadId}/comments`)),

  createComment: (
    viewId: string,
    threadId: string,
    data: { content: string; parentId?: string },
  ): Promise<unknown> =>
    apiClient.post(`/views/${viewId}/threads/${threadId}/comments`, data),
}