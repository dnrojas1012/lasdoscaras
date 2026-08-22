<script setup lang="ts">

import { useToastStore } from '../../stores/toast.store'

const props = defineProps<{ url: string; title: string }>()

const toast = useToastStore()

async function share(): Promise<void> {

  const full = `${window.location.origin}${props.url}`

  // navigator.share solo existe en navegadores moviles y algunos de escritorio.

  // Si no existe, se copia al portapapeles como alternativa.

  if (typeof navigator.share === 'function') {

    try {

      await navigator.share({ title: props.title, url: full })

      return

    } catch {

      // El usuario cancelo el dialogo: no es un error que deba avisarse.

      return

    }

  }

  try {

    await navigator.clipboard.writeText(full)

    toast.success('Enlace copiado al portapapeles')

  } catch {

    toast.error('No fue posible copiar el enlace')

  }

}

</script>

<template>

  <button class="share" aria-label="Compartir publicación" @click.stop.prevent="share">

    Compartir

  </button>

</template>

<style scoped>

.share {

  background: none;

  border: 1px solid var(--color-border);

  border-radius: 6px;

  padding: 0.3rem 0.7rem;

  color: var(--color-text-muted);

  cursor: pointer;

  font-size: 0.85rem;

}

.share:hover { color: var(--color-primary); border-color: var(--color-primary); }

</style>
