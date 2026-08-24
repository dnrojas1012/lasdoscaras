<script setup lang="ts">

import { ref, computed, watch, onMounted } from 'vue'

import { useRoute, useRouter, RouterLink } from 'vue-router'

import { searchApi, type SearchResults } from '../api/search.api'

import { ApiError, NetworkError } from '../api/apiClient'

import { useDebounce } from '../composables/useDebounce'

import PublicationCard from '../components/publication/PublicationCard.vue'

import HighlightText from '../components/ui/HighlightText.vue'

import SkeletonCard from '../components/ui/SkeletonCard.vue'

import EmptyState from '../components/ui/EmptyState.vue'

const route = useRoute()

const router = useRouter()

const termino = ref(String(route.query.q ?? ''))

// Mismo debounce de 300 ms que la barra de navegacion, exigido por el enunciado.

const terminoDebounced = useDebounce(termino, 300)

const resultados = ref<SearchResults>({ views: [], categories: [], hashtags: [], users: [] })

const cargando = ref(false)

const error = ref<string | null>(null)

const buscado = ref('')

const totalResultados = computed(

  () =>

    resultados.value.views.length +

    resultados.value.categories.length +

    resultados.value.hashtags.length +

    resultados.value.users.length,

)

async function buscar(q: string): Promise<void> {

  const limpio = q.trim()

  if (limpio.length < 2) {

    resultados.value = { views: [], categories: [], hashtags: [], users: [] }

    buscado.value = ''

    return

  }

  cargando.value = true

  error.value = null

  try {

    resultados.value = await searchApi.global(limpio)

    buscado.value = limpio

  } catch (e) {

    error.value =

      e instanceof ApiError || e instanceof NetworkError

        ? e.message

        : 'No se pudo completar la búsqueda.'

  } finally {

    cargando.value = false

  }

}

// Al escribir en el buscador de esta pantalla se actualiza la URL.

// Asi el resultado es compartible y el boton Atras del navegador funciona.

watch(terminoDebounced, (valor) => {

  const limpio = valor.trim()

  if (limpio === String(route.query.q ?? '')) return

  void router.replace({ name: 'search', query: limpio.length > 0 ? { q: limpio } : {} })

})

// Se observa la URL, no el input: asi tambien funciona cuando la busqueda

// llega desde la barra de navegacion o desde un enlace compartido.

watch(

  () => route.query.q,

  (q) => {

    const valor = String(q ?? '')

    termino.value = valor

    void buscar(valor)

  },

)

onMounted(() => void buscar(termino.value))

</script>

<template>

  <section class="search">

    <h1 class="search__title">Búsqueda</h1>

    <div class="search__box">

      <label for="search-q" class="sr-only">Buscar publicaciones, categorías, hashtags o usuarios</label>

      <input

        id="search-q"

        v-model="termino"

        type="search"

        placeholder="Escribí al menos 2 caracteres…"

        autocomplete="off"

      />

    </div>

    <p v-if="termino.trim().length > 0 && termino.trim().length < 2" class="search__hint">

      Escribí al menos 2 caracteres para buscar.

    </p>

    <p v-else-if="buscado.length > 0 && !cargando && !error" class="search__count">

      {{ totalResultados }} {{ totalResultados === 1 ? 'resultado' : 'resultados' }}

      para "<strong>{{ buscado }}</strong>"

    </p>

    <div v-if="cargando" class="grid">

      <SkeletonCard v-for="n in 3" :key="n" />

    </div>

    <EmptyState v-else-if="error" title="No se pudo completar la búsqueda" :message="error">

      <button class="btn" @click="buscar(termino)">Reintentar</button>

    </EmptyState>

    <EmptyState

      v-else-if="buscado.length > 0 && totalResultados === 0"

      title="Sin resultados"

      :message="`No encontramos nada para &quot;${buscado}&quot;. Probá con otras palabras.`"

    />

    <template v-else-if="buscado.length > 0">

      <!-- CATEGORIAS -->

      <section v-if="resultados.categories.length" class="block">

        <h2>Categorías</h2>

        <ul class="chips">

          <li v-for="c in resultados.categories" :key="c.id">

            <RouterLink :to="`/categories/${c.id}`">

              <HighlightText :text="c.name" :term="buscado" />

            </RouterLink>

          </li>

        </ul>

      </section>

      <!-- HASHTAGS -->

      <section v-if="resultados.hashtags.length" class="block">

        <h2>Hashtags</h2>

        <ul class="chips">

          <li v-for="h in resultados.hashtags" :key="h.id">

            <RouterLink :to="{ name: 'board', query: { hashtag: h.name } }">

              #<HighlightText :text="h.name" :term="buscado" />

            </RouterLink>

          </li>

        </ul>

      </section>

      <!-- AUTORES -->

      <section v-if="resultados.users.length" class="block">

        <h2>Autores</h2>

        <ul class="authors">

          <li v-for="u in resultados.users" :key="u.id">

            <RouterLink :to="`/authors/${u.id}`">

              <HighlightText :text="u.name" :term="buscado" />

            </RouterLink>

          </li>

        </ul>

      </section>

      <!-- PUBLICACIONES -->

      <section v-if="resultados.views.length" class="block">

        <h2>Publicaciones</h2>

        <!-- El titulo resaltado va arriba de cada tarjeta, porque

             PublicationCard es un componente compartido y no debe

             modificarse para un caso puntual de esta pantalla. -->

        <div class="grid">

          <div v-for="v in resultados.views" :key="v.id" class="hit">

            <p class="hit__title">

              <HighlightText :text="v.side?.title ?? ''" :term="buscado" />

            </p>

            <PublicationCard :view="v" />

          </div>

        </div>

      </section>

    </template>

    <EmptyState

      v-else

      title="Buscá cualquier tema"

      message="Podés buscar por título, argumento, categoría, hashtag o autor."

    />

  </section>

</template>

<style scoped>

.search__title { font-size: 1.5rem; margin: 0 0 1rem; }

.search__box { margin-bottom: 0.8rem; }

.search__box input {

  width: 100%; padding: 0.7rem 1rem;

  border: 1px solid var(--color-border); border-radius: 999px;

  background: var(--color-bg); color: var(--color-text); font-size: 1rem;

}

.search__hint, .search__count { color: var(--color-text-muted); font-size: 0.88rem; margin: 0 0 1.2rem; }

.block { margin-bottom: 2rem; }

.block h2 {

  font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.05em;

  color: var(--color-text-muted); margin: 0 0 0.7rem;

}

.chips, .authors { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; margin: 0; }

.chips a, .authors a {

  display: inline-block;

  background: var(--color-surface); border: 1px solid var(--color-border);

  border-radius: 999px; padding: 0.3rem 0.8rem;

  color: var(--color-primary); text-decoration: none; font-size: 0.85rem;

}

.chips a:hover, .authors a:hover { border-color: var(--color-primary); }

.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (min-width: 768px) { .grid { grid-template-columns: repeat(2, 1fr); } }

@media (min-width: 1100px) { .grid { grid-template-columns: repeat(3, 1fr); } }

.hit { display: flex; flex-direction: column; gap: 0.4rem; }

.hit__title { font-size: 0.85rem; color: var(--color-text-muted); margin: 0; }

.btn {

  margin-top: 1rem; padding: 0.5rem 1.2rem; border: none; border-radius: 6px;

  background: var(--color-primary); color: var(--color-primary-contrast); cursor: pointer;

}

.sr-only {

  position: absolute; width: 1px; height: 1px;

  padding: 0; margin: -1px; overflow: hidden;

  clip: rect(0,0,0,0); white-space: nowrap; border: 0;

}

</style>
