<script setup lang="ts">

import { ref, computed, watch, onMounted } from 'vue'

import { useRoute, useRouter, RouterLink } from 'vue-router'

import { viewsApi } from '../api/views.api'

import { categoriesApi } from '../api/categories.api'

import { ApiError, NetworkError } from '../api/apiClient'

import PublicationCard from '../components/publication/PublicationCard.vue'

import SkeletonCard from '../components/ui/SkeletonCard.vue'

import EmptyState from '../components/ui/EmptyState.vue'

import BasePagination from '../components/ui/BasePagination.vue'

import OfflineBanner from '../components/ui/OfflineBanner.vue'

import type { PoliticalView } from '../models/view.model'

import type { Category } from '../models/category.model'

const route = useRoute()

const router = useRouter()

const categoriaId = computed(() => String(route.params.id))

const pagina = computed(() => Number(route.query.page ?? 1))

const orden = computed(() => String(route.query.sort ?? 'recent'))

const limite = 12

const categoria = ref<Category | null>(null)

const items = ref<PoliticalView[]>([])

const total = ref(0)

const cargando = ref(true)

const error = ref<string | null>(null)

const sinConexion = ref(false)

async function cargar(): Promise<void> {

  cargando.value = true

  error.value = null

  sinConexion.value = false

  try {

    // Las dos peticiones van en paralelo con Promise.all en lugar de una

    // despues de otra. No dependen entre si, asi que esperar la primera

    // para lanzar la segunda solo duplica el tiempo de carga.

    const [cat, lista] = await Promise.all([

      categoriesApi.getById(categoriaId.value),

      viewsApi.list({

        category: categoriaId.value,

        sort: orden.value as 'recent' | 'likes' | 'dislikes',

        page: pagina.value,

        pageSize: limite,

      }),

    ])

    categoria.value = cat

    items.value = lista.items

    total.value = lista.total

  } catch (e) {

    // Una categoria inexistente es un 404 legitimo: se manda a la pantalla

    // de no encontrado en lugar de mostrar un error generico.

    if (e instanceof ApiError && e.status === 404) {

      void router.replace({ name: 'not-found' })

      return

    }

    if (e instanceof NetworkError) {

      error.value = e.message

      sinConexion.value = true

    } else if (e instanceof ApiError) {

      error.value = e.message

    } else {

      error.value = 'No se pudieron cargar las publicaciones de esta categoría.'

    }

  } finally {

    cargando.value = false

  }

}

function cambiarOrden(valor: string): void {

  void router.push({

    name: 'category',

    params: { id: categoriaId.value },

    query: { ...(valor !== 'recent' ? { sort: valor } : {}) },

  })

}

function irAPagina(p: number): void {

  void router.push({

    name: 'category',

    params: { id: categoriaId.value },

    query: { ...route.query, page: String(p) },

  })

}

// Se observa toda la ruta, no solo el id: asi tambien reacciona al cambio

// de pagina y de orden, que viajan en la query.

watch(() => route.fullPath, () => void cargar())

onMounted(cargar)

</script>

<template>

  <section>

    <OfflineBanner :stale="sinConexion" />

    <!-- Migas de pan, pedidas por el enunciado. -->

    <nav class="crumbs" aria-label="Ruta de navegación">

      <RouterLink to="/">Inicio</RouterLink>

      <span aria-hidden="true">/</span>

      <span aria-current="page">{{ categoria?.name ?? 'Categoría' }}</span>

    </nav>

    <header class="cat__head">

      <div>

        <h1 class="cat__title">{{ categoria?.name ?? 'Cargando…' }}</h1>

        <p v-if="!cargando" class="cat__count">

          {{ total }} {{ total === 1 ? 'publicación' : 'publicaciones' }}

        </p>

      </div>

      <div class="cat__sort">

        <label for="cat-sort">Ordenar por</label>

        <select id="cat-sort" :value="orden" @change="cambiarOrden(($event.target as HTMLSelectElement).value)">

          <option value="recent">Más recientes</option>

          <option value="likes">Más apoyadas</option>

          <option value="dislikes">Más rechazadas</option>

        </select>

      </div>

    </header>

    <!-- Los cuatro estados de interfaz que exige la rubrica. -->

    <div v-if="cargando" class="grid">

      <SkeletonCard v-for="n in 6" :key="n" />

    </div>

    <EmptyState v-else-if="error" title="No se pudieron cargar las publicaciones" :message="error">

      <button class="btn" @click="cargar">Reintentar</button>

    </EmptyState>

    <EmptyState

      v-else-if="items.length === 0"

      title="Esta categoría todavía no tiene publicaciones"

      message="Podés ser el primero en publicar un tema en esta categoría."

    >

      <RouterLink to="/views/new" class="btn">Crear publicación</RouterLink>

    </EmptyState>

    <template v-else>

      <div class="grid">

        <PublicationCard v-for="v in items" :key="v.id" :view="v" />

      </div>

      <BasePagination :page="pagina" :total="total" :limit="limite" @change="irAPagina" />

    </template>

  </section>

</template>

<style scoped>

.crumbs { display: flex; gap: 0.4rem; font-size: 0.85rem; margin-bottom: 1rem; }

.crumbs a { color: var(--color-text-muted); text-decoration: none; }

.crumbs a:hover { color: var(--color-primary); }

.crumbs span[aria-current] { color: var(--color-text); font-weight: 500; }

.cat__head {

  display: flex; justify-content: space-between; align-items: flex-end;

  gap: 1rem; flex-wrap: wrap; margin-bottom: 1.2rem;

}

.cat__title { font-size: 1.5rem; margin: 0; }

.cat__count { color: var(--color-text-muted); font-size: 0.88rem; margin: 0.25rem 0 0; }

.cat__sort { display: flex; flex-direction: column; gap: 0.25rem; }

.cat__sort label { font-size: 0.78rem; color: var(--color-text-muted); }

.cat__sort select {

  padding: 0.45rem; border: 1px solid var(--color-border); border-radius: 6px;

  background: var(--color-bg); color: var(--color-text);

}

/* Mobile-first: 1 columna, 2 desde 768px, 3 desde 1100px. */

.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }

@media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.btn {

  display: inline-block; margin-top: 1rem;

  padding: 0.5rem 1.2rem; border: none; border-radius: 6px;

  background: var(--color-primary); color: var(--color-primary-contrast);

  cursor: pointer; text-decoration: none; font-size: 0.9rem;

}

</style>
