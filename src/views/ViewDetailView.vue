<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { viewsApi } from '../api/views.api'
import { commentsApi } from '../api/comments.api'
import { historyService } from '../services/historyService'
import { useAuthStore } from '../stores/auth.store'
import { useFavoritesStore } from '../stores/favorites.store'
import { useToastStore } from '../stores/toast.store'
import { ApiError, NetworkError } from '../api/apiClient'
import SidePanel from '../components/publication/SidePanel.vue'
import CommentThreadItem from '../components/publication/CommentThreadItem.vue'
import ShareButton from '../components/publication/ShareButton.vue'
import EmptyState from '../components/ui/EmptyState.vue'
import type { PoliticalView } from '../models/view.model'
import type { CommentThread } from '../models/comment.model'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const favorites = useFavoritesStore()
const toast = useToastStore()

const id = computed(() => String(route.params.id))

const vista = ref<PoliticalView | null>(null)
const hilos = ref<CommentThread[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)

// UNA bandera POR LADO. Si fuera una sola, reaccionar en el Lado A
// bloquearia tambien el Lado B, y dejarian de ser independientes.
const enviandoA = ref(false)
const enviandoB = ref(false)

const esFavorito = computed(() => (vista.value ? favorites.isFavorite(vista.value.id) : false))
const esAutor = computed(() => auth.user?.id === vista.value?.author?.id)

const nuevoHiloTitulo = ref('')
const nuevoHiloTexto = ref('')
const creandoHilo = ref(false)

async function cargar(): Promise<void> {
  cargando.value = true
  error.value = null
  try {
    vista.value = await viewsApi.getById(id.value)

    // Se registra la visita en el historial LOCAL. Sin llamada al API.
    historyService.add({
      id: vista.value.id,
      titulo: vista.value.side?.title ?? 'Sin título',
      categoria: vista.value.category?.name ?? 'Sin categoría',
    })

    try {
      hilos.value = await commentsApi.listThreads(id.value)
    } catch {
      hilos.value = []
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      void router.replace({ name: 'not-found' })
      return
    }
    error.value =
      e instanceof NetworkError || e instanceof ApiError
        ? e.message
        : 'No se pudo cargar la publicación.'
  } finally {
    cargando.value = false
  }
}

// Un solo metodo, pero el parametro 'lado' mantiene todo separado:
// cada llamada afecta unicamente al lado que se le pasa.
async function reaccionar(lado: 'a' | 'b', tipo: 'like' | 'dislike'): Promise<void> {
  if (vista.value === null) return
  const bandera = lado === 'a' ? enviandoA : enviandoB
  if (bandera.value) return
  bandera.value = true
  try {
    await viewsApi.react(vista.value.id, lado, tipo)
    // Se recarga la publicacion para traer los contadores reales del servidor,
    // en lugar de calcularlos en el cliente y arriesgar que se desincronicen.
    vista.value = await viewsApi.getById(vista.value.id)
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible registrar la reacción')
  } finally {
    bandera.value = false
  }
}

async function alternarFavorito(): Promise<void> {
  if (vista.value === null) return
  try {
    await favorites.toggle(vista.value.id)
    toast.success(esFavorito.value ? 'Agregado a favoritos' : 'Quitado de favoritos')
  } catch {
    toast.error('No fue posible actualizar favoritos')
  }
}

async function crearHilo(): Promise<void> {
  if (creandoHilo.value || vista.value === null) return
  if (nuevoHiloTexto.value.trim().length < 2) {
    toast.warning('Escriba el contenido del hilo')
    return
  }
  creandoHilo.value = true
  try {
    await commentsApi.createThread(vista.value.id, {
      title: nuevoHiloTitulo.value.trim() || undefined,
      content: nuevoHiloTexto.value.trim(),
    })
    nuevoHiloTitulo.value = ''
    nuevoHiloTexto.value = ''
    hilos.value = await commentsApi.listThreads(vista.value.id)
    toast.success('Hilo creado')
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible crear el hilo')
  } finally {
    creandoHilo.value = false
  }
}

async function despublicar(): Promise<void> {
  if (vista.value === null) return
  try {
    await viewsApi.unpublish(vista.value.id)
    toast.success('Publicación despublicada')
    await cargar()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible despublicar')
  }
}

const fecha = computed(() =>
  vista.value
    ? new Date(vista.value.createdAt).toLocaleDateString('es-CR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '',
)

onMounted(cargar)
</script>

<template>
  <div v-if="cargando" class="detail__loading">Cargando publicación…</div>

  <EmptyState v-else-if="error" title="No se pudo cargar la publicación" :message="error">
    <button class="btn" @click="cargar">Reintentar</button>
  </EmptyState>

  <article v-else-if="vista" class="detail">
    <nav class="detail__crumbs">
      <RouterLink to="/">Inicio</RouterLink>
      <span>/</span>
      <RouterLink :to="`/categories/${vista.category?.id}`">{{ vista.category?.name }}</RouterLink>
    </nav>

    <header class="detail__head">
      <div class="detail__meta">
        <RouterLink :to="`/categories/${vista.category?.id}`" class="badge">
          {{ vista.category?.name }}
        </RouterLink>
        <span class="detail__by">
          por
          <RouterLink :to="`/authors/${vista.author?.id}`">{{ vista.author?.name }}</RouterLink>
          · {{ fecha }}
        </span>
      </div>

      <div class="detail__actions">
        <button
          v-if="auth.isAuthenticated"
          class="fav"
          :class="{ 'fav--on': esFavorito }"
          :aria-pressed="esFavorito"
          :aria-label="esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          @click="alternarFavorito"
        >
          {{ esFavorito ? '★' : '☆' }}
        </button>
        <ShareButton :url="`/views/${vista.id}`" :title="vista.side?.title ?? 'LasDosCaras'" />
        <RouterLink v-if="esAutor" :to="`/views/${vista.id}/edit`" class="btn btn--ghost">
          Editar
        </RouterLink>
        <button v-if="auth.isSuperadmin" class="btn btn--danger" @click="despublicar">
          Despublicar
        </button>
      </div>
    </header>

    <ul v-if="vista.hashtags?.length" class="detail__tags">
      <li v-for="t in vista.hashtags" :key="t.id">
        <RouterLink :to="{ name: 'board', query: { hashtag: t.name } }">#{{ t.name }}</RouterLink>
      </li>
    </ul>

    <!-- LOS DOS PANELES. Cada uno con su propia barra de reacciones,
         sus propios contadores y su propia bandera de envio. -->
    <div class="detail__sides">
      <SidePanel
        :side="vista.side"
        variant="a"
        etiqueta="Postura"
        :my-reaction="vista.side?.myReaction ?? null"
        :disabled="enviandoA"
        :can-react="auth.isAuthenticated"
        @react="(t) => reaccionar('a', t)"
      />
      <SidePanel
        :side="vista.counterpart"
        variant="b"
        etiqueta="Contrapostura"
        :my-reaction="vista.counterpart?.myReaction ?? null"
        :disabled="enviandoB"
        :can-react="auth.isAuthenticated"
        @react="(t) => reaccionar('b', t)"
      />
    </div>

    <section class="detail__comments">
      <h2>Discusión</h2>

      <div v-if="auth.isAuthenticated" class="newthread">
        <label for="nt-title" class="sr-only">Título del hilo</label>
        <input id="nt-title" v-model="nuevoHiloTitulo" placeholder="Título del hilo (opcional)" />
        <label for="nt-body" class="sr-only">Contenido del hilo</label>
        <textarea id="nt-body" v-model="nuevoHiloTexto" rows="2" placeholder="Abrí un nuevo hilo de discusión…"></textarea>
        <button class="btn" :disabled="creandoHilo" @click="crearHilo">
          {{ creandoHilo ? 'Creando…' : 'Crear hilo' }}
        </button>
      </div>

      <CommentThreadItem
        v-for="h in hilos"
        :key="h.id"
        :thread="h"
        :view-id="vista.id"
      />

      <p v-if="hilos.length === 0" class="detail__nothreads">
        Todavía no hay hilos de discusión. Sé el primero en abrir uno.
      </p>
    </section>
  </article>
</template>

<style scoped>
.detail {
  min-width: 0;
}
.detail__loading { padding: 3rem; text-align: center; color: var(--color-text-muted); }

.detail__crumbs { display: flex; gap: 0.4rem; font-size: 0.85rem; margin-bottom: 1rem; }
.detail__crumbs a { color: var(--color-text-muted); text-decoration: none; }
.detail__crumbs a:hover { color: var(--color-primary); }

.detail__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 0.8rem;
}
.detail__meta { display: flex; flex-direction: column; gap: 0.4rem; }
.badge {
  align-self: flex-start;
  background: var(--color-primary); color: var(--color-primary-contrast);
  border-radius: 999px; padding: 0.15rem 0.7rem;
  font-size: 0.78rem; text-decoration: none;
}
.detail__by { font-size: 0.85rem; color: var(--color-text-muted); }
.detail__by a { color: var(--color-primary); }

.detail__actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.fav { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: var(--color-text-muted); }
.fav--on { color: var(--color-warning); }

.detail__tags { display: flex; gap: 0.5rem; list-style: none; padding: 0; margin: 0 0 1.2rem; flex-wrap: wrap; }
.detail__tags a { color: var(--color-primary); font-size: 0.82rem; text-decoration: none; }

/* Mobile-first: los paneles se apilan en movil y van lado a lado
   desde 900px. En movil siguen siendo claramente dos secciones. */
.detail__sides { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.detail__sides > * { min-width: 0; }
@media (min-width: 900px) {
  .detail__sides { grid-template-columns: 1fr 1fr; }
}

.detail__comments { margin-top: 2.5rem; }
.detail__comments h2 { font-size: 1.2rem; margin-bottom: 1rem; }
.detail__nothreads { color: var(--color-text-muted); font-size: 0.9rem; }

.newthread { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.2rem; }
.newthread input, .newthread textarea {
  padding: 0.6rem; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text); font-family: inherit;
}

.btn {
  padding: 0.5rem 1.1rem; border-radius: 6px; cursor: pointer;
  background: var(--color-primary); color: var(--color-primary-contrast);
  border: none; text-decoration: none; display: inline-block; font-size: 0.9rem;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text); }
.btn--danger { background: var(--color-error); }
.newthread .btn { align-self: flex-start; }

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>