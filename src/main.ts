import { createApp } from 'vue'

import { createPinia } from 'pinia'

import router from './router'

import { useAuthStore } from './stores/auth.store'

import { setUnauthorizedHandler } from './api/apiClient'

import App from './App.vue'

import './styles/tokens.css'

import './styles/globals.css'

const app = createApp(App)

// Pinia debe registrarse ANTES de usar cualquier store.

// Si se invierte el orden, la app falla al arrancar.

app.use(createPinia())

app.use(router)

// Ahora sí se puede pedir el store de sesión.

const auth = useAuthStore()

// Restaura la sesión guardada en el navegador.

// Sin esta línea, al recargar la página con F5 se perdería la sesión.

auth.restoreSession()

// Cierra la importación circular: el apiClient recibe acá la función

// que debe ejecutar cuando el servidor devuelva un 401.

setUnauthorizedHandler(() => {

  auth.logout()

  router.push({ name: 'login', query: { expired: '1' } })

})

app.mount('#app')

