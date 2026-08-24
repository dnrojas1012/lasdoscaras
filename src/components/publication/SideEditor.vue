<script setup lang="ts">
import { computed } from 'vue'
import SourceEditor, { type SourceDraft } from './SourceEditor.vue'

export interface SideDraft {
  title: string
  description: string
  sources: SourceDraft[]
}

const props = defineProps<{
  modelValue: SideDraft
  variant: 'a' | 'b'
  etiqueta: string
  ayuda: string
  idPrefix: string
  errores?: Record<string, string>
  disabled?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: SideDraft): void }>()

// Limites del enunciado.
const MAX_TITULO = 120
const MIN_DESC = 100

function set(cambios: Partial<SideDraft>): void {
  emit('update:modelValue', { ...props.modelValue, ...cambios })
}

const largoTitulo = computed(() => props.modelValue.title.length)
const largoDesc = computed(() => props.modelValue.description.length)
const faltanDesc = computed(() => Math.max(0, MIN_DESC - largoDesc.value))
</script>

<template>
  <section class="side" :class="`side--${variant}`">
    <header class="side__head">
      <span class="side__tag">{{ etiqueta }}</span>
      <p class="side__help">{{ ayuda }}</p>
    </header>

    <div class="field">
      <label :for="`${idPrefix}-title`">Título de la postura</label>
      <input
        :id="`${idPrefix}-title`"
        :value="modelValue.title"
        type="text"
        :maxlength="MAX_TITULO"
        :disabled="disabled"
        :class="{ 'field--err': errores?.title }"
        :aria-invalid="Boolean(errores?.title)"
        placeholder="Una frase que resuma esta postura"
        @input="set({ title: ($event.target as HTMLInputElement).value })"
      />
      <div class="field__meta">
        <span :class="{ 'field__count--max': largoTitulo >= MAX_TITULO }">
          {{ largoTitulo }} / {{ MAX_TITULO }}
        </span>
      </div>
      <p v-if="errores?.title" class="field__err" role="alert">{{ errores.title }}</p>
    </div>

    <div class="field">
      <label :for="`${idPrefix}-desc`">Argumento</label>
      <textarea
        :id="`${idPrefix}-desc`"
        :value="modelValue.description"
        rows="7"
        :disabled="disabled"
        :class="{ 'field--err': errores?.description }"
        :aria-invalid="Boolean(errores?.description)"
        placeholder="Desarrollá los argumentos de esta postura con el mayor detalle posible."
        @input="set({ description: ($event.target as HTMLTextAreaElement).value })"
      ></textarea>
      <div class="field__meta">
        <span>{{ largoDesc }} caracteres</span>
        <span v-if="faltanDesc > 0" class="field__count--min">
          faltan {{ faltanDesc }} para el mínimo
        </span>
      </div>
      <p v-if="errores?.description" class="field__err" role="alert">{{ errores.description }}</p>
    </div>

    <SourceEditor
      :model-value="modelValue.sources"
      :id-prefix="idPrefix"
      :error="errores?.sources"
      :disabled="disabled"
      @update:model-value="(s) => set({ sources: s })"
    />
  </section>
</template>

<style scoped>
.side {
  border: 1px solid var(--color-border); border-left: 5px solid;
  border-radius: 10px; padding: 1.1rem;
  display: flex; flex-direction: column; gap: 1rem;
  background: var(--color-surface);
}
.side--a { border-left-color: var(--color-side-a); }
.side--b { border-left-color: var(--color-side-b); }
.side__head { display: flex; flex-direction: column; gap: 0.2rem; }
.side__tag { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.side--a .side__tag { color: var(--color-side-a); }
.side--b .side__tag { color: var(--color-side-b); }
.side__help { font-size: 0.82rem; color: var(--color-text-muted); margin: 0; }

.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 500; }
.field input, .field textarea {
  padding: 0.55rem; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text);
  font-family: inherit; font-size: 0.92rem; resize: vertical;
}
.field--err { border-color: var(--color-error); }
.field__meta { display: flex; justify-content: space-between; font-size: 0.73rem; color: var(--color-text-muted); }
.field__count--max { color: var(--color-warning); font-weight: 600; }
.field__count--min { color: var(--color-warning); }
.field__err { font-size: 0.8rem; color: var(--color-error); margin: 0; }
</style>