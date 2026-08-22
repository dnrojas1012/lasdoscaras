<script setup lang="ts">

import { ref, watch, onMounted } from 'vue'

import { useRoute, useRouter } from 'vue-router'

import { viewsApi } from '../api/views.api'

import { cacheService, CACHE_KEYS } from '../services/cacheService'

import PublicationCard from '../components/publication/PublicationCard.vue'

import FilterPanel from '../components/publication/FilterPanel.vue'

import SkeletonCard from '../components/ui/SkeletonCard.vue'

import EmptyState from '../components/ui/EmptyState.vue'

import BasePagination from '../components/ui/BasePagination.vue'

import OfflineBanner from '../components/ui/OfflineBanner.vue'

import { ApiError, NetworkError } from '../api/apiClient'

import type { PoliticalView } from '../models/view.model'

const route = useRoute()

const router = useRouter()

const items = ref<PoliticalView[]>([])

const total = ref(0)

const limit = 12

// Los tres estados de interfaz que exige la rubrica.

const cargando = ref(true)

const error = ref<string | null>(null)

const sinConexion = ref(false)

// Los filtros se leen de la URL para que sean compartibles

// y sobrevivan a una recarga. Es un requisito del enunciado.

const filtros = ref({

  category: (route.query.category as string) ?? '',

  hashtag: (route.query.hashtag as string) ?? '',

  sort: (route.query.sort as string) ?? 'recent',

  page: Number(route.query.page ?? 1),

})

async function cargar(): Promise<void> {

  cargando.value = true

  error.value = null

  sinConexion.value = false

  try {

    const data = await viewsApi.list({

      category: filtros.value.category || undefined,

      hashtag: filtros.value.hashtag || undefined,

      sort: filtros.value.sort as 'recent' | 'likes' | 'dislikes',

      page: filtros.value.page,

      limit,

    })

    items.value = data.items

    total.value = data.total

  } catch (e) {

    if (e instanceof NetworkError) {

      error.value = e.message

      sinConexion.value = true

    } else if (e instanceof ApiError) {

      error.value = e.message

    } else {

      error.value = 'Ocurrió un error inesperado al cargar las publicaciones.'

    }

  } finally {

    cargando.value = false

  }

}

// Escribe los filtros en la URL. El watch de abajo detecta el cambio y recarga.

function aplicar(nuevos: { category: string; hashtag: string; sort: string }): void {

  router.push({

    name: 'board',

    query: {

      ...(nuevos.category ? { category: nuevos.category } : {}),

      ...(nuevos.hashtag ? { hashtag: nuevos.hashtag } : {}),

      ...(nuevos.sort !== 'recent' ? { sort: nuevos.sort } : {}),

    },

  })

}

function limpiar(): void {

  router.push({ name: 'board' })

}

function irAPagina(page: number): void {

  router.push({ name: 'board', query: { ...route.query, page: String(page) } })

}

watch(

  () => route.query,

  (q) => {

    filtros.value = {

      category: (q.category as string) ?? '',

      hashtag: (q.hashtag as string) ?? '',

      sort: (q.sort as string) ?? 'recent',

      page: Number(q.page ?? 1),

    }

    // Se recuerdan los ultimos filtros usados, segun el enunciado.

    cacheService.set(CACHE_KEYS.filters, filtros.value)

    void cargar()

  },

)

onMounted(() => {

  cacheService.set(CACHE_KEYS.filters, filtros.value)

  void cargar()

})

</script>

<template>

  <section>

    <OfflineBanner :stale="sinConexion" />

    <h1 class="board__title">Las dos caras de cada tema</h1>

    <FilterPanel

      :category="filtros.category"

      :hashtag="filtros.hashtag"

      :sort="filtros.sort"

      @update="aplicar"

      @reset="limpiar"

    />

    <!-- ESTADO 1: cargando -->

    <div v-if="cargando" class="board__grid">

      <SkeletonCard v-for="n in 6" :key="n" />

    </div>

    <!-- ESTADO 2: error -->

    <EmptyState

      v-else-if="error"

      title="No se pudieron cargar las publicaciones"

      :message="error"

    >

      <button class="retry" @click="cargar">Reintentar</button>

    </EmptyState>

    <!-- ESTADO 3: vacio -->

    <EmptyState

      v-else-if="items.length === 0"

      title="No hay publicaciones que coincidan"

      message="Probá cambiar los filtros o limpiarlos para ver todo."

    >

      <button class="retry" @click="limpiar">Limpiar filtros</button>

    </EmptyState>

    <!-- ESTADO 4: con datos -->

    <template v-else>

      <div class="board__grid">

        <PublicationCard v-for="v in items" :key="v.id" :view="v" />

      </div>

      <BasePagination :page="filtros.page" :total="total" :limit="limit" @change="irAPagina" />

    </template>

  </section>

</template>

<style scoped>

.board__title { font-size: 1.5rem; margin-bottom: 1rem; }

/* Mobile-first: una columna por defecto, dos o mas en pantallas grandes.

   El enunciado pide minimo 2 columnas en escritorio y 1 en movil. */

.board__grid {

  display: grid;

  grid-template-columns: 1fr;

  gap: 1rem;

  margin-top: 1.2rem;

}

@media (min-width: 768px) {

  .board__grid { grid-template-columns: repeat(2, 1fr); }

}

@media (min-width: 1100px) {

  .board__grid { grid-template-columns: repeat(3, 1fr); }

}

.retry {

  margin-top: 1rem;

  padding: 0.5rem 1.2rem;

  border: 1px solid var(--color-primary);

  border-radius: 6px;

  background: var(--color-primary);

  color: var(--color-primary-contrast);

  cursor: pointer;

}

</style>
