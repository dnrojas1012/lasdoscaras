<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { categoriesApi } from '../../api/categories.api'
import { hashtagsApi } from '../../api/hashtags.api'
import type { Category } from '../../models/category.model'
import type { Hashtag } from '../../models/hashtag.model'

const props = defineProps<{ category: string; hashtag: string; sort: string }>()
const emit = defineEmits<{
  (e: 'update', payload: { category: string; hashtag: string; sort: string }): void
  (e: 'reset'): void
}>()

const categories = ref<Category[]>([])
const hashtags = ref<Hashtag[]>([])

// Se cargan al montar. Vienen del cache si esta vigente,
// asi que en la segunda visita aparecen al instante.
onMounted(async () => {
  try {
    categories.value = await categoriesApi.list()
  } catch { categories.value = [] }
  try {
    hashtags.value = await hashtagsApi.list()
  } catch { hashtags.value = [] }
})

function change(campo: 'category' | 'hashtag' | 'sort', valor: string): void {
  emit('update', {
    category: campo === 'category' ? valor : props.category,
    hashtag: campo === 'hashtag' ? valor : props.hashtag,
    sort: campo === 'sort' ? valor : props.sort,
  })
}
</script>

<template>
  <aside class="filters">
    <div class="filters__group">
      <label for="f-cat">Categoría</label>
      <select id="f-cat" :value="category" @change="change('category', ($event.target as HTMLSelectElement).value)">
        <option value="">Todas</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <div class="filters__group">
      <label for="f-tag">Hashtag</label>
      <select id="f-tag" :value="hashtag" @change="change('hashtag', ($event.target as HTMLSelectElement).value)">
        <option value="">Todos</option>
        <option v-for="h in hashtags" :key="h.id" :value="h.name">#{{ h.name }}</option>
      </select>
    </div>

    <div class="filters__group">
      <label for="f-sort">Ordenar por</label>
      <select id="f-sort" :value="sort" @change="change('sort', ($event.target as HTMLSelectElement).value)">
        <option value="recent">Más recientes</option>
        <option value="likes">Más apoyadas</option>
        <option value="dislikes">Más rechazadas</option>
      </select>
    </div>

    <button class="filters__reset" @click="emit('reset')">Limpiar filtros</button>
  </aside>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
}
.filters__group { display: flex; flex-direction: column; gap: 0.3rem; flex: 1 1 10rem; }
.filters__group label { font-size: 0.8rem; color: var(--color-text-muted); }
.filters__group select {
  padding: 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  color: var(--color-text);
}
.filters__reset {
  padding: 0.45rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: none;
  color: var(--color-text-muted);
  cursor: pointer;
}
</style>