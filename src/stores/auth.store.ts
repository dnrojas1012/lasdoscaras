import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth.api'
import { cacheService, CACHE_KEYS } from '../services/cacheService'
import type { User } from '../models/user.model'

interface StoredAuth {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', () => {
  // ref() crea un dato: cuando cambia, todo lo que lo usa
  // en pantalla se vuelve a dibujar automáticamente.
  const token = ref<string | null>(null)
  const user = ref<User | null>(null)
  // computed() es un valor derivado que se recalcula solo cuando
  // cambia algo de lo que depende. No hay que actualizarlo a mano.
  const isAuthenticated = computed<boolean>(() => token.value !== null)
  const isSuperadmin = computed<boolean>(() => user.value?.role === 'SUPERADMIN')
  // Se llama una sola vez, al arrancar la aplicación.

  // Sin esta función, al recargar la página con F5 se perdería la sesión.
  function restoreSession(): void {
    const stored = cacheService.get<StoredAuth>(CACHE_KEYS.auth)
    if (stored === null) return
    token.value = stored.token
    user.value = stored.user
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await authApi.login({ email, password })
    token.value = response.token
    // Se guarda el token ANTES de pedir el perfil, porque authApi.me()
    // necesita que el token ya esté disponible para el apiClient.
    cacheService.set<Partial<StoredAuth>>(CACHE_KEYS.auth, { token: response.token })
    // Si el API ya devolvió el usuario, se usa. Si no, se pide aparte.
    // Así funciona sin importar cuál de las dos formas use el servidor.
    const perfil = response.user ?? (await authApi.me())
    user.value = perfil
    cacheService.set<StoredAuth>(CACHE_KEYS.auth, { token: response.token, user: perfil })
  }

   async function register(name: string, email: string, password: string): Promise<void> {
    
    // 1. Crear la cuenta. Queda en estado PENDING y devuelve el token
    // de activacion. En un sistema real ese token llegaria por correo.
    const respuesta = await authApi.register({ name, email, password }) as unknown as
      { activationToken?: string; token?: string }
    
      // 2. Activar la cuenta. Sin este paso, el login siguiente falla.
    if (respuesta.activationToken) {
      await authApi.activate(respuesta.activationToken)
    }

    // 3. Iniciar sesion con las mismas credenciales.
    await login(email, password)
  }


  function logout(): void {
    token.value = null
    user.value = null
    cacheService.remove(CACHE_KEYS.auth)
    // También se borran los favoritos: son del usuario que se va.
    cacheService.remove(CACHE_KEYS.favorites)
  }

  // Lo que se devuelve acá es lo que queda disponible
  // para el resto de la aplicación.
  return {
    token,
    user,
    isAuthenticated,
    isSuperadmin,
    restoreSession,
    login,
    register,
    logout,
  }
})
