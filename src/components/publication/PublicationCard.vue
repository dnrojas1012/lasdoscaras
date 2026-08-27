<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/auth.store'
import { useFavoritesStore } from '../../stores/favorites.store'
import { useToastStore } from '../../stores/toast.store'
import ShareButton from './ShareButton.vue'
import type { PoliticalView } from '../../models/view.model'

const props = defineProps<{ view: PoliticalView }>()

const auth = useAuthStore()
const favorites = useFavoritesStore()
const toast = useToastStore()

const esFavorito = computed(() => favorites.isFavorite(props.view.id))

// Se corta a 160 caracteres para que todas las tarjetas del tablero
// mantengan una altura pareja, sin importar que tan largo sea el
// argumento completo de la publicacion.
const extracto = computed(() => {
  const texto = props.view.side?.description ?? ''
  return texto.length > 160 ? `${texto.slice(0, 160)}…` : texto
})

const fecha = computed(() =>
  new Date(props.view.createdAt).toLocaleDateString('es-CR', {
    day: 'numeric', month: 'short', year: 'numeric',
  }),
)

// El store ya actualiza el estado local antes de confirmar con el API
// (favorites.toggle es optimista); esta funcion solo se encarga de
// avisar el resultado y de revertir el aviso si el servidor rechaza.
async function toggleFavorito(): Promise<void> {
  try {
    await favorites.toggle(props.view.id)
    toast.success(esFavorito.value ? 'Agregado a favoritos' : 'Quitado de favoritos')
  } catch {
    toast.error('No fue posible actualizar favoritos')
  }
}
</script>

<template>
  <article class="card">
    <header class="card__head">
      <RouterLink :to="`/categories/${view.category?.id}`" class="badge" @click.stop>
        {{ view.category?.name ?? 'Sin categoría' }}
      </RouterLink>
      <time class="card__date">{{ fecha }}</time>
    </header>

    <RouterLink :to="`/views/${view.id}`" class="card__title">
      {{ view.side?.title ?? 'Sin título' }}
    </RouterLink>

    <p class="card__excerpt">{{ extracto }}</p>

    <ul v-if="view.hashtags?.length" class="card__tags">
      <li v-for="tag in view.hashtags" :key="tag.id">#{{ tag.name }}</li>
    </ul>

    <!--  Contadores INDEPENDIENTES por lado.-->

    <div class="card__sides">
      <div class="side side--a">
        <span class="side__label">Postura</span>
        <span>👍 {{ view.side?.likes ?? 0 }}</span>
        <span>👎 {{ view.side?.dislikes ?? 0 }}</span>
      </div>
      <div class="side side--b">
        <span class="side__label">Contrapostura</span>
        <span>👍 {{ view.counterpart?.likes ?? 0 }}</span>
        <span>👎 {{ view.counterpart?.dislikes ?? 0 }}</span>
      </div>
    </div>

    <footer class="card__foot">
      <RouterLink :to="`/authors/${view.author?.id}`" class="card__author" @click.stop>
        {{ view.author?.name ?? 'Anónimo' }}
      </RouterLink>

      <div class="card__actions">
        <!-- El boton de favorito solo aparece con sesion iniciada. -->
        <button
          v-if="auth.isAuthenticated"
          class="fav"
          :class="{ 'fav--on': esFavorito }"
          :aria-pressed="esFavorito"
          :aria-label="esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'"
          @click.stop.prevent="toggleFavorito"
        >
          {{ esFavorito ? '★' : '☆' }}
        </button>
        <ShareButton :url="`/views/${view.id}`" :title="view.side?.title ?? 'LasDosCaras'" />
      </div>
    </footer>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  transition: border-color 0.15s ease;
}
.card:hover { border-color: var(--color-primary); }

.card__head { display: flex; justify-content: space-between; align-items: center; }
.badge {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.75rem;
  text-decoration: none;
}
.card__date { color: var(--color-text-muted); font-size: 0.78rem; }

.card__title {
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  line-height: 1.35;
}
.card__title:hover { color: var(--color-primary); }

.card__excerpt { color: var(--color-text-muted); font-size: 0.9rem; margin: 0; }

.card__tags { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; padding: 0; margin: 0; }
.card__tags li { font-size: 0.75rem; color: var(--color-primary); }

.card__sides { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.side {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  border-left: 3px solid;
}
.side--a { border-color: var(--color-side-a); background: color-mix(in srgb, var(--color-side-a) 8%, transparent); }
.side--b { border-color: var(--color-side-b); background: color-mix(in srgb, var(--color-side-b) 8%, transparent); }
.side__label { font-weight: 600; color: var(--color-text); }

.card__foot { display: flex; justify-content: space-between; align-items: center; }
.card__author { color: var(--color-text-muted); font-size: 0.85rem; text-decoration: none; }
.card__author:hover { color: var(--color-primary); text-decoration: underline; }

.card__actions { display: flex; align-items: center; gap: 0.5rem; }
.fav {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--color-text-muted);
  line-height: 1;
}
.fav--on { color: var(--color-warning); }
</style>