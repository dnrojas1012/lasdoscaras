<script setup lang="ts">

import { ref, watch } from 'vue'

import { useRouter, RouterLink } from 'vue-router'

import { useAuthStore } from '../../stores/auth.store'

import { useThemeStore } from '../../stores/theme.store'

import { useFavoritesStore } from '../../stores/favorites.store'

import { useDebounce } from '../../composables/useDebounce'

const router = useRouter()

const auth = useAuthStore()

const theme = useThemeStore()

const favorites = useFavoritesStore()

const termino = ref('')

// Debounce de 300 ms, exigido por el enunciado.

const terminoDebounced = useDebounce(termino, 300)

watch(terminoDebounced, (valor) => {

  if (valor.trim().length >= 2) {

    router.push({ name: 'search', query: { q: valor.trim() } })

  }

})

function cerrarSesion(): void {

  auth.logout()

  favorites.clear()

  router.push({ name: 'board' })

}

</script>

<template>

  <header class="nav">

    <RouterLink to="/" class="nav__logo">LasDosCaras</RouterLink>

    <div class="nav__search">

      <label for="nav-q" class="sr-only">Buscar publicaciones</label>

      <input id="nav-q" v-model="termino" type="search" placeholder="Buscar..." />

    </div>

    <nav class="nav__actions">

      <button

        class="nav__theme"

        :aria-label="theme.current === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"

        @click="theme.toggle()"

      >

        {{ theme.current === 'dark' ? '☀' : '☾' }}

      </button>

      <template v-if="auth.isAuthenticated">

        <RouterLink to="/views/new">Publicar</RouterLink>

        <RouterLink to="/profile">{{ auth.user?.name }}</RouterLink>

        <RouterLink v-if="auth.isSuperadmin" to="/admin/users">Panel de administración</RouterLink>

        <button class="nav__logout" @click="cerrarSesion">Salir</button>

      </template>

      <template v-else>

        <RouterLink to="/login">Ingresar</RouterLink>

        <RouterLink to="/register">Registrarse</RouterLink>

      </template>

    </nav>

  </header>

</template>

<style scoped>

.nav {

  display: flex;

  align-items: center;

  gap: 1rem;

  flex-wrap: wrap;

  padding: 0.8rem 1.2rem;

  background: var(--color-surface);

  border-bottom: 1px solid var(--color-border);

  position: sticky;

  top: 0;

  z-index: 100;

}

.nav__logo { font-weight: 700; color: var(--color-primary); text-decoration: none; font-size: 1.1rem; }

.nav__search { flex: 1 1 12rem; }

.nav__search input {

  width: 100%;

  padding: 0.45rem 0.7rem;

  border: 1px solid var(--color-border);

  border-radius: 999px;

  background: var(--color-bg);

  color: var(--color-text);

}

.nav__actions { display: flex; align-items: center; gap: 0.9rem; }

.nav__actions a { color: var(--color-text); text-decoration: none; font-size: 0.9rem; }

.nav__actions a:hover { color: var(--color-primary); }

.nav__theme, .nav__logout {

  background: none; border: none; cursor: pointer;

  color: var(--color-text); font-size: 0.9rem;

}

.nav__theme { font-size: 1.1rem; }

/* Oculta visualmente pero deja el texto disponible para lectores de pantalla. */

.sr-only {

  position: absolute; width: 1px; height: 1px;

  padding: 0; margin: -1px; overflow: hidden;

  clip: rect(0,0,0,0); white-space: nowrap; border: 0;

}

@media (max-width: 640px) {

  .nav { gap: 0.6rem; }

  .nav__actions { gap: 0.6rem; font-size: 0.85rem; }

}

</style>
