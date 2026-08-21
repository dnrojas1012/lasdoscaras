<script setup lang="ts">

import { useRoute } from 'vue-router'

// useRoute() devuelve información de la dirección actual del navegador.

const route = useRoute()

</script>

<template>

  <section class="placeholder">

    <h1>Pantalla en construcción</h1>

    <!-- Las dobles llaves muestran el valor de una variable en pantalla. -->

    <p>Ruta actual: <code>{{ route.path }}</code></p>
 </section>

</template>

<style scoped>

/* 'scoped' hace que estos estilos apliquen SOLO a este componente.

   No hay colisiones de nombres de clase entre archivos. */

.placeholder {

  padding: 2rem;

  text-align: center;

}

</style>
