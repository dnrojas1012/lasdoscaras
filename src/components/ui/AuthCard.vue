<script setup lang="ts">

defineProps<{ title: string; subtitle?: string }>()

</script>

<template>

  <section class="auth">

    <div class="auth__card">

      <h1 class="auth__title">{{ title }}</h1>

      <p v-if="subtitle" class="auth__sub">{{ subtitle }}</p>

      <slot />

    </div>

  </section>

</template>

<style scoped>

.auth { display: flex; justify-content: center; padding: 2rem 1rem; }

.auth__card {

  width: 100%; max-width: 26rem;

  background: var(--color-surface);

  border: 1px solid var(--color-border);

  border-radius: 12px;

  padding: 2rem 1.5rem;

}

.auth__title { font-size: 1.4rem; margin: 0 0 0.3rem; }

.auth__sub { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 1.5rem; }

</style>
