<script setup lang="ts">
import { computed } from 'vue'
import type { Source } from '../../models/source.model'

const props = defineProps<{ sources: Source[] }>()

// Extrae el identificador del video de una URL de YouTube.
// Soporta los dos formatos: youtube.com/watch?v=ID y youtu.be/ID
function youtubeId(url: string): string | null {
  const patron = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/
  const match = url.match(patron)
  return match ? match[1] : null
}

const items = computed(() =>
  props.sources.map((s) => ({
    ...s,
    videoId: s.type === 'YOUTUBE' ? youtubeId(s.url) : null,
    icono: s.type === 'YOUTUBE' ? '▶' : s.type === 'DOCUMENT' ? '📄' : '🔗',
    etiqueta: s.label ?? s.url,
  })),
)
</script>

<template>
  <div v-if="items.length" class="sources">
    <h4 class="sources__title">Fuentes</h4>
    <ul class="sources__list">
      <li v-for="src in items" :key="src.id" class="source">
        <div class="source__head">
          <span class="source__icon" aria-hidden="true">{{ src.icono }}</span>
          <a :href="src.url" target="_blank" rel="noopener noreferrer">
            {{ src.etiqueta }}
          </a>
        </div>

        <!-- Los videos de YouTube se muestran incrustados,
             como pide el enunciado. -->
        <div v-if="src.videoId" class="source__video">
          <iframe
            :src="`https://www.youtube.com/embed/${src.videoId}`"
            :title="src.etiqueta"
            loading="lazy"
            allowfullscreen
          ></iframe>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.sources { margin-top: 1rem; }
.sources__title { font-size: 0.85rem; text-transform: uppercase; color: var(--color-text-muted); margin-bottom: 0.5rem; }
.sources__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.source__head { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.source__head a { color: var(--color-primary); word-break: break-all; }
.source__icon { flex-shrink: 0; }

/* Truco clasico para que el video mantenga proporcion 16:9
   sin importar el ancho de la pantalla. */
.source__video {
  position: relative;
  padding-top: 56.25%;
  border-radius: 8px;
  overflow: hidden;
}
.source__video iframe {
  position: absolute; inset: 0;
  width: 100%; height: 100%; border: 0;
}
</style>