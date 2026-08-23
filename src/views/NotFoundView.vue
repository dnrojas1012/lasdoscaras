<script setup lang="ts">

import { RouterLink } from 'vue-router'

</script>

<template>

  <section class="err">

    <p class="err__code">404</p>

    <h1>Página no encontrada</h1>

    <p class="err__msg">La dirección que buscás no existe o fue movida.</p>

    <RouterLink to="/" class="err__btn">Volver al inicio</RouterLink>

  </section>

</template>

<style scoped>

.err { text-align: center; padding: 4rem 1rem; }

.err__code { font-size: 4rem; font-weight: 700; color: var(--color-primary); margin: 0; }

.err__msg { color: var(--color-text-muted); }

.err__btn {

  display: inline-block; margin-top: 1.5rem; padding: 0.6rem 1.4rem;

  background: var(--color-primary); color: var(--color-primary-contrast);

  border-radius: 6px; text-decoration: none;

}

</style>
