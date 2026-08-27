<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ text: string; term: string }>()

function escaparRegex(valor: string): string {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Parte el texto en fragmentos, marcando cuales coinciden.
// Se devuelven datos, no HTML: Vue escapa cada fragmento al renderizar,
// asi que no hay riesgo de inyeccion.

const partes = computed(() => {
  const termino = props.term.trim()
  if (termino.length === 0) return [{ texto: props.text, coincide: false }]
  const patron = new RegExp(`(${escaparRegex(termino)})`, 'gi')
  return props.text
    .split(patron)
    .filter((p) => p.length > 0)
    .map((p) => ({ texto: p, coincide: p.toLowerCase() === termino.toLowerCase() }))
})

</script>
<template>
  <span>
    <template v-for="(p, i) in partes" :key="i">
      <mark v-if="p.coincide">{{ p.texto }}</mark>
      <template v-else>{{ p.texto }}</template>
    </template>
  </span>
</template>
<style scoped>

mark {
  background: var(--color-warning);
  color: #1a1a1a;
  padding: 0 0.1em;
  border-radius: 2px;
}

</style>
