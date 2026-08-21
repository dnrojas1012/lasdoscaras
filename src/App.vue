<script setup lang="ts">

import ToastContainer from './components/ui/ToastContainer.vue'

</script>

<template>

  <!-- RouterView es el hueco donde el router dibuja la pantalla actual.

       Cambia solo según la dirección del navegador. -->

  <RouterView />

  <!-- Va fuera del RouterView para que los avisos se mantengan

       visibles al cambiar de pantalla. -->

  <ToastContainer />

</template>
