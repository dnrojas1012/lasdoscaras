<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{ stale?: boolean }>()
const enLinea = ref(navigator.onLine)

function actualizar(): void {
  enLinea.value = navigator.onLine
}

// El navegador avisa cuando se pierde o recupera la conexion.
onMounted(() => {
  window.addEventListener('online', actualizar)
  window.addEventListener('offline', actualizar)
})

// Siempre hay que quitar los listeners al desmontar, o se acumulan.
onUnmounted(() => {
  window.removeEventListener('online', actualizar)
  window.removeEventListener('offline', actualizar)
})

</script>
<template>
  <div v-if="!enLinea || props.stale" class="offline" role="status">
    Mostrando información guardada — sin conexión al servidor
  </div>
</template>
<style scoped>

.offline {
  background: var(--color-warning);
  color: #1a1a1a;
  text-align: center;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

</style>

