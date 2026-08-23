<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="err">
    <p class="err__code" aria-hidden="true">403</p>
    <h1>Acceso denegado</h1>
    <p class="err__msg">
      No tenés permisos para ver esta sección. Si creés que es un error,
      contactá a un administrador.
    </p>
    <RouterLink to="/" class="err__btn">Volver al inicio</RouterLink>
  </section>
</template>

<style scoped>
.err { text-align: center; padding: 4rem 1rem; }

.err__code {
  font-size: 4rem;
  font-weight: 700;
  /* Color de advertencia en lugar del primario: comunica que es un
     bloqueo por permisos, no una dirección equivocada. */
  color: var(--color-warning);
  margin: 0;
}

.err__msg {
  color: var(--color-text-muted);
  max-width: 32rem;
  margin: 0 auto;
}

.err__btn {
  display: inline-block;
  margin-top: 1.5rem;
  padding: 0.6rem 1.4rem;
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  border-radius: 6px;
  text-decoration: none;
}

.err__btn:hover { opacity: 0.9; }
</style>