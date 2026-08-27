import type { Router } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
export function applyGuards(router: Router): void {

  // beforeEach se ejecuta antes de CADA navegación, sin excepción.
  router.beforeEach((to) => {

    const auth = useAuthStore()
    const requiresAuth = to.meta.requiresAuth === true
    const guestOnly = to.meta.guestOnly === true
    const requiresRole = to.meta.requiresRole

    // 1. Ruta protegida sin sesión: al login, recordando a dónde iba
    //para poder devolverlo ahí después de iniciar sesión.
    if (requiresAuth && !auth.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    // 2. Login o registro con sesión ya iniciada: al tablero.
    if (guestOnly && auth.isAuthenticated) {
      return { name: 'board' }
    }

    // 3. Rol insuficiente: a la página 403, NO al login.
    // El enunciado es explícito en esto: el usuario puede estar
    // autenticado y simplemente no tener el rol correcto.
    if (typeof requiresRole === 'string' && auth.user?.role !== requiresRole) {
      return { name: 'forbidden' }
    }

    // 4. Todo en orden: se permite la navegación.
    return true
  })
}
