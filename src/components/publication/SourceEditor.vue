<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadsApi } from '../../api/uploads.api'
import { useToastStore } from '../../stores/toast.store'
import { ApiError } from '../../api/apiClient'

export interface SourceDraft {
  type: 'LINK' | 'YOUTUBE' | 'DOCUMENT'
  url: string
  label: string
}

const props = defineProps<{
  modelValue: SourceDraft[]
  idPrefix: string
  error?: string | null
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: SourceDraft[]): void }>()

const toast = useToastStore()
const subiendo = ref<number | null>(null)

function actualizar(indice: number, cambios: Partial<SourceDraft>): void {
  const copia = props.modelValue.map((s, i) => (i === indice ? { ...s, ...cambios } : s))
  emit('update:modelValue', copia)
}

function agregar(): void {
  emit('update:modelValue', [...props.modelValue, { type: 'LINK', url: '', label: '' }])
}

function quitar(indice: number): void {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== indice))
}

// Extrae el id del video. Soporta los tres formatos de URL de YouTube.
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/)
  return m ? m[1] : null
}

const previews = computed(() =>
  props.modelValue.map((s) => (s.type === 'YOUTUBE' ? youtubeId(s.url) : null)),
)

async function elegirArchivo(indice: number, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validacion en cliente antes de subir: evita esperar una subida
  // completa solo para recibir un rechazo.
  const problema = uploadsApi.validate(file)
  if (problema !== null) {
    toast.error(problema)
    input.value = ''
    return
  }

  subiendo.value = indice
  try {
    const url = await uploadsApi.document(file)
    // Si no habia titulo, se usa el nombre del archivo.
    const label = props.modelValue[indice].label || file.name
    actualizar(indice, { url, label })
    toast.success('Documento subido')
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible subir el documento')
  } finally {
    subiendo.value = null
    input.value = ''
  }
}
</script>

<template>
  <fieldset class="sources" :disabled="disabled">
    <legend>Fuentes</legend>

    <div v-for="(src, i) in modelValue" :key="`${idPrefix}-${i}`" class="source">
      <div class="source__row">
        <div class="source__field source__field--type">
          <label :for="`${idPrefix}-type-${i}`">Tipo</label>
          <select
            :id="`${idPrefix}-type-${i}`"
            :value="src.type"
            @change="actualizar(i, { type: ($event.target as HTMLSelectElement).value as SourceDraft['type'], url: '' })"
          >
            <option value="LINK">Enlace</option>
            <option value="YOUTUBE">Video de YouTube</option>
            <option value="DOCUMENT">Documento</option>
          </select>
        </div>

        <div class="source__field">
          <label :for="`${idPrefix}-label-${i}`">Título de la fuente</label>
          <input
            :id="`${idPrefix}-label-${i}`"
            :value="src.label"
            type="text"
            placeholder="Ej: Informe del BCCR 2025"
            @input="actualizar(i, { label: ($event.target as HTMLInputElement).value })"
          />
        </div>

        <button
          type="button"
          class="source__del"
          :aria-label="`Eliminar fuente ${i + 1}`"
          @click="quitar(i)"
        >×</button>
      </div>

      <!-- Enlace y YouTube piden URL escrita. Documento pide un archivo. -->
      <div v-if="src.type !== 'DOCUMENT'" class="source__field">
        <label :for="`${idPrefix}-url-${i}`">
          {{ src.type === 'YOUTUBE' ? 'URL del video' : 'URL' }}
        </label>
        <input
          :id="`${idPrefix}-url-${i}`"
          :value="src.url"
          type="text"
          :placeholder="src.type === 'YOUTUBE' ? 'https://youtube.com/watch?v=...' : 'https://...'"
          @input="actualizar(i, { url: ($event.target as HTMLInputElement).value })"
        />
      </div>

      <div v-else class="source__field">
        <label :for="`${idPrefix}-file-${i}`">Archivo (PDF, Word o texto, máx. 20 MB)</label>
        <input
          :id="`${idPrefix}-file-${i}`"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          :disabled="subiendo === i"
          @change="elegirArchivo(i, $event)"
        />
        <p v-if="subiendo === i" class="source__up">Subiendo…</p>
        <p v-else-if="src.url" class="source__ok">Archivo cargado: {{ src.url }}</p>
      </div>

      <!-- Vista previa del video, pedida por el enunciado. -->
      <div v-if="previews[i]" class="source__video">
        <iframe
          :src="`https://www.youtube.com/embed/${previews[i]}`"
          :title="src.label || 'Vista previa del video'"
          loading="lazy"
          allowfullscreen
        ></iframe>
      </div>
      <p v-else-if="src.type === 'YOUTUBE' && src.url.length > 0" class="source__warn">
        La URL no parece ser un video de YouTube válido.
      </p>
    </div>

    <button type="button" class="sources__add" @click="agregar">+ Agregar fuente</button>

    <p v-if="error" class="sources__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.sources { border: 1px dashed var(--color-border); border-radius: 8px; padding: 0.9rem; margin: 0; }
.sources legend { font-size: 0.8rem; text-transform: uppercase; color: var(--color-text-muted); padding: 0 0.4rem; }
.source { border-top: 1px solid var(--color-border); padding: 0.8rem 0; display: flex; flex-direction: column; gap: 0.6rem; }
.source:first-of-type { border-top: none; padding-top: 0; }
.source__row { display: flex; gap: 0.6rem; align-items: flex-end; flex-wrap: wrap; }
.source__field { display: flex; flex-direction: column; gap: 0.25rem; flex: 1 1 10rem; }
.source__field--type { flex: 0 0 10rem; }
.source__field label { font-size: 0.78rem; color: var(--color-text-muted); }
.source__field input, .source__field select {
  padding: 0.45rem; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text); font-size: 0.88rem;
}
.source__del {
  background: none; border: 1px solid var(--color-border); border-radius: 6px;
  color: var(--color-error); cursor: pointer; padding: 0.35rem 0.6rem; font-size: 1rem; line-height: 1;
}
.sources__add {
  margin-top: 0.7rem; background: none; border: 1px solid var(--color-primary);
  color: var(--color-primary); border-radius: 6px; padding: 0.4rem 0.9rem; cursor: pointer; font-size: 0.85rem;
}
.sources__error { color: var(--color-error); font-size: 0.8rem; margin: 0.5rem 0 0; }
.source__up, .source__ok, .source__warn { font-size: 0.78rem; margin: 0; }
.source__up { color: var(--color-text-muted); }
.source__ok { color: var(--color-success); word-break: break-all; }
.source__warn { color: var(--color-warning); }
.source__video { position: relative; padding-top: 56.25%; border-radius: 8px; overflow: hidden; }
.source__video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>