<script setup lang="ts">

import { ref, computed, watch } from 'vue'

import { useRoute, useRouter, RouterLink } from 'vue-router'

import { viewsApi } from '../api/views.api'

import { useAuthStore } from '../stores/auth.store'

import { useFavoritesStore } from '../stores/favorites.store'

import { useToastStore } from '../stores/toast.store'

import { historyService, type HistoryEntry } from '../services/historyService'

import { ApiError, NetworkError } from '../api/apiClient'

import PublicationCard from '../components/publication/PublicationCard.vue'

import SkeletonCard from '../components/ui/SkeletonCard.vue'

import EmptyState from '../components/ui/EmptyState.vue'

import BasePagination from '../components/ui/BasePagination.vue'

import type { PoliticalView } from '../models/view.model'

type Tab = 'publicaciones' | 'favoritos' | 'historial'

const route = useRoute()

const router = useRouter()

const auth = useAuthStore()

const favorites = useFavoritesStore()

const toast = useToastStore()

// La pestaña activa vive en la URL, no en una variable local suelta.

// Asi se puede compartir el enlace a una pestaña especifica y el boton

// Atras del navegador funciona como se espera.

function esTabValida(v: unknown): v is Tab {

  return v === 'publicaciones' || v === 'favoritos' || v === 'historial'

}

const tab = computed<Tab>(() => (esTabValida(route.query.tab) ? route.query.tab : 'publicaciones'))

function irATab(t: Tab): void {

  void router.push({ name: 'profile', query: { tab: t } })

}

const iniciales = computed(() =>

  (auth.user?.name ?? '?')

    .split(/\s+/)

    .filter((p) => p.length > 0)

    .slice(0, 2)

    .map((p) => p[0]?.toUpperCase())

    .join(''),

)

// ==================== MIS PUBLICACIONES ====================

const misPublicaciones = ref<PoliticalView[]>([])

const totalPub = ref(0)

const paginaPub = computed(() => Number(route.query.page ?? 1))

const limitePub = 9

const cargandoPub = ref(false)

const errorPub = ref<string | null>(null)

async function cargarPublicaciones(): Promise<void> {

  cargandoPub.value = true

  errorPub.value = null

  try {

    // 'autor: me' filtra por el usuario autenticado. El API lo resuelve

    // por el token, no hace falta mandar el id.

    const data = await viewsApi.list({ autor: 'me', page: paginaPub.value, pageSize: limitePub })

    misPublicaciones.value = data.items

    totalPub.value = data.total

  } catch (e) {

    errorPub.value =

      e instanceof ApiError || e instanceof NetworkError

        ? e.message

        : 'No se pudieron cargar tus publicaciones.'

  } finally {

    cargandoPub.value = false

  }

}

function irAPaginaPub(p: number): void {

  void router.push({ name: 'profile', query: { tab: 'publicaciones', page: String(p) } })

}

// ==================== MIS FAVORITOS ====================

const misFavoritos = ref<PoliticalView[]>([])

const cargandoFav = ref(false)

const errorFav = ref<string | null>(null)

async function cargarFavoritos(): Promise<void> {

  if (favorites.ids.length === 0) {

    misFavoritos.value = []

    return

  }

  cargandoFav.value = true

  errorFav.value = null

  try {

    // El store solo guarda los IDs. Para mostrar las tarjetas hace falta

    // el objeto completo de cada publicacion, asi que se piden una por

    // una y en paralelo.

    //

    // Promise.allSettled en lugar de Promise.all: si UNA publicacion

    // favorita fue borrada del servidor, allSettled deja que las demas

    // se resuelvan igual. Con Promise.all, un solo fallo tira abajo toda

    // la lista de favoritos, aunque el resto exista sin problema.

    const resultados = await Promise.allSettled(favorites.ids.map((id) => viewsApi.getById(id)))

    misFavoritos.value = resultados

      .filter((r): r is PromiseFulfilledResult<PoliticalView> => r.status === 'fulfilled')

      .map((r) => r.value)

  } catch {

    errorFav.value = 'No se pudieron cargar tus favoritos.'

  } finally {

    cargandoFav.value = false

  }

}

// ==================== HISTORIAL ====================

// Se lee directo de localStorage. NUNCA se llama al API para esto:

// el enunciado especifica que el historial es un dato local del navegador.

const historial = ref<HistoryEntry[]>([])

function cargarHistorial(): void {

  historial.value = historyService.list()

}

function limpiarHistorial(): void {

  historyService.clear()

  historial.value = []

  toast.success('Historial borrado')

}

function fechaCorta(iso: string): string {

  return new Date(iso).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })

}

// ==================== CARGA SEGUN LA PESTAÑA ACTIVA ====================

// Un solo watch decide que cargar. Evita tener tres onMounted sueltos

// que se pisarian entre si al cambiar de pestaña.

watch(

  () => [tab.value, route.query.page],

  () => {

    if (tab.value === 'publicaciones') void cargarPublicaciones()

    else if (tab.value === 'favoritos') void cargarFavoritos()

    else cargarHistorial()

  },

  { immediate: true },

)

</script>

<template>

  <section class="profile">

    <header class="profile__head">

      <div class="profile__avatar" aria-hidden="true">{{ iniciales || '?' }}</div>

      <div>

        <h1>{{ auth.user?.name }}</h1>

        <p class="profile__email">{{ auth.user?.email }}</p>

      </div>

    </header>

    <nav class="tabs" role="tablist">

      <button

        role="tab"

        :aria-selected="tab === 'publicaciones'"

        :class="{ active: tab === 'publicaciones' }"

        @click="irATab('publicaciones')"

      >

        Mis Publicaciones

      </button>

      <button

        role="tab"

        :aria-selected="tab === 'favoritos'"

        :class="{ active: tab === 'favoritos' }"

        @click="irATab('favoritos')"

      >

        Mis Favoritos

      </button>

      <button

        role="tab"

        :aria-selected="tab === 'historial'"

        :class="{ active: tab === 'historial' }"

        @click="irATab('historial')"

      >

        Historial

      </button>

    </nav>

    <!-- MIS PUBLICACIONES -->

    <div v-if="tab === 'publicaciones'" role="tabpanel">

      <div v-if="cargandoPub" class="grid">

        <SkeletonCard v-for="n in 3" :key="n" />

      </div>

      <EmptyState v-else-if="errorPub" title="No se pudieron cargar tus publicaciones" :message="errorPub">

        <button class="btn" @click="cargarPublicaciones">Reintentar</button>

      </EmptyState>

      <EmptyState

        v-else-if="misPublicaciones.length === 0"

        title="Todavía no publicaste nada"

        message="Cuando publiques un tema, va a aparecer acá."

      >

        <RouterLink to="/views/new" class="btn">Crear publicación</RouterLink>

      </EmptyState>

      <template v-else>

        <div class="grid">

          <PublicationCard v-for="v in misPublicaciones" :key="v.id" :view="v" />

        </div>

        <BasePagination :page="paginaPub" :total="totalPub" :limit="limitePub" @change="irAPaginaPub" />

      </template>

    </div>

    <!-- MIS FAVORITOS -->

    <div v-else-if="tab === 'favoritos'" role="tabpanel">

      <div v-if="cargandoFav" class="grid">

        <SkeletonCard v-for="n in 3" :key="n" />

      </div>

      <EmptyState v-else-if="errorFav" title="No se pudieron cargar tus favoritos" :message="errorFav">

        <button class="btn" @click="cargarFavoritos">Reintentar</button>

      </EmptyState>

      <EmptyState

        v-else-if="misFavoritos.length === 0"

        title="No tenés publicaciones favoritas"

        message="Marcá publicaciones con la estrella para encontrarlas acá."

      />

      <div v-else class="grid">

        <PublicationCard v-for="v in misFavoritos" :key="v.id" :view="v" />

      </div>

    </div>

    <!-- HISTORIAL -->

    <div v-else role="tabpanel">

      <div class="hist__head">

        <p class="hist__count">{{ historial.length }} de 20 visitas guardadas</p>

        <button v-if="historial.length > 0" class="btn btn--ghost" @click="limpiarHistorial">

          Vaciar historial

        </button>

      </div>

      <EmptyState

        v-if="historial.length === 0"

        title="Todavía no visitaste ninguna publicación"

        message="Las últimas 20 publicaciones que abras van a aparecer acá."

      />

      <ul v-else class="hist">

        <li v-for="h in historial" :key="h.id + h.fechaVista">

          <RouterLink :to="`/views/${h.id}`">

            <span class="hist__title">{{ h.titulo }}</span>

            <span class="hist__meta">{{ h.categoria }} · {{ fechaCorta(h.fechaVista) }}</span>

          </RouterLink>

        </li>

      </ul>

    </div>

  </section>

</template>

<style scoped>

.profile__head {

  display: flex; align-items: center; gap: 1.1rem;

  margin-bottom: 1.6rem;

}

.profile__avatar {

  width: 3.5rem; height: 3.5rem; flex-shrink: 0; border-radius: 50%;

  background: var(--color-primary); color: var(--color-primary-contrast);

  display: flex; align-items: center; justify-content: center;

  font-size: 1.2rem; font-weight: 700;

}

.profile__head h1 { font-size: 1.35rem; margin: 0; }

.profile__email { color: var(--color-text-muted); font-size: 0.85rem; margin: 0.15rem 0 0; }

.tabs {

  display: flex; gap: 0.3rem; border-bottom: 1px solid var(--color-border);

  margin-bottom: 1.4rem; overflow-x: auto;

}

.tabs button {

  padding: 0.6rem 1rem; background: none; border: none;

  border-bottom: 2px solid transparent;

  color: var(--color-text-muted); cursor: pointer; font-size: 0.9rem;

  white-space: nowrap;

}

.tabs button.active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }

@media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.hist__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

.hist__count { color: var(--color-text-muted); font-size: 0.85rem; margin: 0; }

.hist { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }

.hist li a {

  display: flex; justify-content: space-between; align-items: center; gap: 1rem;

  padding: 0.7rem 0.9rem; border: 1px solid var(--color-border); border-radius: 8px;

  text-decoration: none; flex-wrap: wrap;

}

.hist__title { color: var(--color-text); font-size: 0.92rem; }

.hist__meta { color: var(--color-text-muted); font-size: 0.8rem; }

.btn {

  margin-top: 1rem; padding: 0.5rem 1.2rem; border: none; border-radius: 6px;

  background: var(--color-primary); color: var(--color-primary-contrast);

  cursor: pointer; text-decoration: none; font-size: 0.9rem; display: inline-block;

}

.btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text); }

</style>
