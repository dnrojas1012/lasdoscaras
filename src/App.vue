<script setup lang="ts">
import { onMounted } from 'vue'
import AppNavbar from './components/ui/AppNavbar.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import { useFavoritesStore } from './stores/favorites.store'
import { useAuthStore } from './stores/auth.store'

const favorites = useFavoritesStore()
const auth = useAuthStore()

onMounted(() => {
  favorites.loadFromCache()
  // Si ya habia sesion restaurada, se sincroniza con el API.
  if (auth.isAuthenticated) void favorites.syncFromApi()
})

</script>
<template>
  <AppNavbar />
  <main class="app-main">
    <RouterView />
  </main>
  <ToastContainer />
</template>
<style scoped>

.app-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

</style>
