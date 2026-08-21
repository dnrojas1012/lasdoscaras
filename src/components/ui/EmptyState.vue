<script setup lang="ts">

defineProps<{ title: string; message?: string }>()

</script>

<template>

  <div class="empty">

    <h2>{{ title }}</h2>

    <p v-if="message">{{ message }}</p>

    <slot />

  </div>

</template>

<style scoped>

.empty {

  padding: 3rem 1rem;

  text-align: center;

  color: var(--color-text-muted);

}

.empty h2 { color: var(--color-text); margin-bottom: 0.5rem; }

</style>
