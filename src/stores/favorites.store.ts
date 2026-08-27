import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cacheService, CACHE_KEYS } from '../services/cacheService'
import { usersApi } from '../api/users.api'
import { viewsApi } from '../api/views.api'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<string[]>([])
  function loadFromCache(): void {
    ids.value = cacheService.get<string[]>(CACHE_KEYS.favorites) ?? []
  }

  function persist(): void {
    cacheService.set<string[]>(CACHE_KEYS.favorites, ids.value)
  }

  // Se llama justo despues del login, para que el icono de favorito
  // se vea correcto desde el primer renderizado del tablero.

  async function syncFromApi(): Promise<void> {
    try {
      ids.value = await usersApi.myFavorites()
      persist()
    } catch {
      // Si falla, se conserva lo que haya en cache.
      loadFromCache()
    }
  }

  function isFavorite(viewId: string): boolean {
    return ids.value.includes(viewId)
  }

  // Actualiza la interfaz de inmediato y despues confirma con el API.
  // Si el API falla, se revierte. Se llama actualizacion optimista.
  async function toggle(viewId: string): Promise<void> {
    const era = isFavorite(viewId)
    ids.value = era ? ids.value.filter((id) => id !== viewId) : [...ids.value, viewId]
    persist()
    try {
      if (era) await viewsApi.removeFavorite(viewId)
      else await viewsApi.addFavorite(viewId)
    } catch (error) {
      ids.value = era ? [...ids.value, viewId] : ids.value.filter((id) => id !== viewId)
      persist()
      throw error
    }
  }

  function clear(): void {
    ids.value = []
    cacheService.remove(CACHE_KEYS.favorites)
  }

  return { ids, loadFromCache, syncFromApi, isFavorite, toggle, clear }

})
