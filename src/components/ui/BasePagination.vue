<script setup lang="ts">

import { computed } from 'vue'

const props = defineProps<{ page: number; total: number; limit: number }>()

const emit = defineEmits<{ (e: 'change', page: number): void }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))

</script>

<template>

  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación">

    <button :disabled="page <= 1" @click="emit('change', page - 1)">Anterior</button>

    <span>Página {{ page }} de {{ totalPages }}</span>

    <button :disabled="page >= totalPages" @click="emit('change', page + 1)">Siguiente</button>

  </nav>

</template>

<style scoped>

.pagination {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 1rem;

  padding: 1.5rem 0;

}

.pagination button {

  padding: 0.5rem 1rem;

  border: 1px solid var(--color-border);

  border-radius: 6px;

  background: var(--color-surface);

  color: var(--color-text);

  cursor: pointer;

}

.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

</style>
