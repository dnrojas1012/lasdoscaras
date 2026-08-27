<script setup lang="ts">

import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { usersApi } from '../api/users.api'
import { viewsApi } from '../api/views.api'
import { ApiError, NetworkError } from '../api/apiClient'
import PublicationCard from '../components/publication/PublicationCard.vue'
import SkeletonCard from '../components/ui/SkeletonCard.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import BasePagination from '../components/ui/BasePagination.vue'
import type { PoliticalView } from '../models/view.model'
import type { User } from '../models/user.model'

const route = useRoute()
const router = useRouter()
const autorId = computed(() => String(route.params.id))
const pagina = computed(() => Number(route.query.page ?? 1))
const limite = 12
const autor = ref<User | null>(null)
const items = ref<PoliticalView[]>([])
const total = ref(0)
const cargando = ref(true)
const error = ref<string | null>(null)

// Iniciales para el avatar. No hay imagenes de perfil en el API,
// asi que se genera un avatar con las iniciales del nombre.
const iniciales = computed(() => {
  const nombre = autor.value?.name ?? ''
  return nombre
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
})

const miembroDesde = computed(() =>
  autor.value?.createdAt
    ? new Date(autor.value.createdAt).toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })
    : '',
)

async function cargar(): Promise<void> {
  cargando.value = true
  error.value = null
  try {

    // El perfil y sus publicaciones se piden en paralelo.
    // El listado se pide con autorId en lugar de usar el arreglo que
    // devuelve /authors/:id, porque asi se obtiene paginacion real.
    const [perfil, lista] = await Promise.all([
      usersApi.getAuthor(autorId.value),
      viewsApi.list({ autorId: autorId.value, page: pagina.value, pageSize: limite }),
    ])

    autor.value = perfil.user
    items.value = lista.items
    total.value = lista.total

  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      void router.replace({ name: 'not-found' })
      return
    }

    error.value =
      e instanceof ApiError || e instanceof NetworkError
        ? e.message
        : 'No se pudo cargar el perfil del autor.'
  } finally {
    cargando.value = false
  }
}

function irAPagina(p: number): void {
  void router.push({
    name: 'author',
    params: { id: autorId.value },
    query: { page: String(p) },
  })
}

watch(() => route.fullPath, () => void cargar())
onMounted(cargar)
</script>
<template>
  <section>
    <nav class="crumbs" aria-label="Ruta de navegación">
      <RouterLink to="/">Inicio</RouterLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{{ autor?.name ?? 'Autor' }}</span>
    </nav>
    <EmptyState v-if="error" title="No se pudo cargar el perfil" :message="error">
      <button class="btn" @click="cargar">Reintentar</button>
    </EmptyState>
    <template v-else>
      <header class="author">
        <div class="author__avatar" aria-hidden="true">{{ iniciales || '?' }}</div>
        <div>
          <h1 class="author__name">{{ autor?.name ?? 'Cargando…' }}</h1>
          <p v-if="miembroDesde" class="author__meta">Miembro desde {{ miembroDesde }}</p>
          <p v-if="!cargando" class="author__meta">
            {{ total }} {{ total === 1 ? 'publicación' : 'publicaciones' }}
          </p>
        </div>
      </header>
      <div v-if="cargando" class="grid">
        <SkeletonCard v-for="n in 3" :key="n" />
      </div>
      <EmptyState
        v-else-if="items.length === 0"
        title="Este autor todavía no tiene publicaciones"
        message="Cuando publique algo, va a aparecer acá."
      />
      <template v-else>
        <div class="grid">
          <PublicationCard v-for="v in items" :key="v.id" :view="v" />
        </div>
        <BasePagination :page="pagina" :total="total" :limit="limite" @change="irAPagina" />
      </template>
    </template>
  </section>
</template>

<style scoped>
.crumbs { display: flex; gap: 0.4rem; font-size: 0.85rem; margin-bottom: 1rem; }
.crumbs a { color: var(--color-text-muted); text-decoration: none; }
.crumbs span[aria-current] { color: var(--color-text); font-weight: 500; }
.author {
  display: flex; align-items: center; gap: 1.1rem;
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 1.2rem; margin-bottom: 1.6rem;
}

.author__avatar {
  width: 3.5rem; height: 3.5rem; flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary); color: var(--color-primary-contrast);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; font-weight: 700;
}

.author__name { font-size: 1.35rem; margin: 0; }
.author__meta { color: var(--color-text-muted); font-size: 0.85rem; margin: 0.2rem 0 0; }
.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.btn {
  margin-top: 1rem; padding: 0.5rem 1.2rem; border: none; border-radius: 6px;
  background: var(--color-primary); color: var(--color-primary-contrast); cursor: pointer;
}

</style>
