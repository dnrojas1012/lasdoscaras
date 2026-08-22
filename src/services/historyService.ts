import { cacheService, CACHE_KEYS } from './cacheService'

export interface HistoryEntry {
  id: string
  titulo: string
  categoria: string
  fechaVista: string
}

// El enunciado fija el maximo en 20 entradas.
const MAX = 20

export const historyService = {
  list(): HistoryEntry[] {
    return cacheService.get<HistoryEntry[]>(CACHE_KEYS.history) ?? []
  },

  // Se agrega al INICIO del arreglo y se recorta a 20.
  // Si la publicacion ya estaba, se quita primero para que suba al tope
  // en lugar de duplicarse.
  add(entry: Omit<HistoryEntry, 'fechaVista'>): void {
    const actual = this.list().filter((e) => e.id !== entry.id)
    const nueva: HistoryEntry = { ...entry, fechaVista: new Date().toISOString() }
    cacheService.set<HistoryEntry[]>(CACHE_KEYS.history, [nueva, ...actual].slice(0, MAX))
  },

  clear(): void {
    cacheService.remove(CACHE_KEYS.history)
  },
}