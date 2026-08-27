<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { hashtagsApi } from '../../api/hashtags.api'
import type { Hashtag } from '../../models/hashtag.model'

const props = defineProps<{
  modelValue: string[]
  error?: string | null
  disabled?: boolean
  max?: number
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string[]): void }>()

const texto = ref('')
const disponibles = ref<Hashtag[]>([])
const limite = computed(() => props.max ?? 8)

onMounted(async () => {
  try {
    disponibles.value = await hashtagsApi.list()
  } catch {
    // Si falla, el campo sigue funcionando sin sugerencias.
    disponibles.value = []
  }
})

// Normaliza: minusculas, sin espacios, sin el simbolo #.
// Asi 'Economia', '#economia' y ' economia ' terminan siendo el mismo tag.
function normalizar(valor: string): string {
  return valor.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-')
}

// Sugerencias: las que coinciden con lo escrito y todavia no fueron elegidas.
const sugerencias = computed(() => {
  const q = normalizar(texto.value)
  if (q.length < 1) return []
  return disponibles.value
    .filter((h) => h.name.toLowerCase().includes(q))
    .filter((h) => !props.modelValue.includes(h.name.toLowerCase()))
    .slice(0, 6)
})

function agregar(valor: string): void {
  const tag = normalizar(valor)
  if (tag.length === 0) return
  if (props.modelValue.includes(tag)) {
    texto.value = ''
    return
  }
  if (props.modelValue.length >= limite.value) return
  emit('update:modelValue', [...props.modelValue, tag])
  texto.value = ''
}

function quitar(tag: string): void {
  emit('update:modelValue', props.modelValue.filter((t) => t !== tag))
}

// Enter y coma agregan. Backspace con el campo vacio borra el ultimo chip,
// que es el comportamiento que la gente espera de este tipo de campo.
function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    agregar(texto.value)
    return
  }
  if (event.key === 'Backspace' && texto.value.length === 0 && props.modelValue.length > 0) {
    quitar(props.modelValue[props.modelValue.length - 1])
  }
}
</script>

<template>
  <div class="tags">
    <label for="tag-input">Hashtags</label>

    <div class="tags__box" :class="{ 'tags__box--error': error }">
      <span v-for="tag in modelValue" :key="tag" class="chip">
        #{{ tag }}
        <button
          type="button"
          class="chip__x"
          :aria-label="`Quitar hashtag ${tag}`"
          :disabled="disabled"
          @click="quitar(tag)"
        >×</button>
      </span>

      <input
        id="tag-input"
        v-model="texto"
        type="text"
        :disabled="disabled || modelValue.length >= limite"
        :placeholder="modelValue.length >= limite ? `Máximo ${limite} hashtags` : 'Escriba y presione Enter'"
        :aria-describedby="error ? 'tag-error' : 'tag-hint'"
        @keydown="onKeydown"
        @blur="agregar(texto)"
      />
    </div>

    <ul v-if="sugerencias.length" class="tags__sug">
      <li v-for="s in sugerencias" :key="s.id">
        <button type="button" @click="agregar(s.name)">#{{ s.name }}</button>
      </li>
    </ul>

    <p v-if="!error" id="tag-hint" class="tags__hint">
      {{ modelValue.length }} de {{ limite }}. Enter o coma para agregar, Backspace para borrar el último.
    </p>
    <p v-else id="tag-error" class="tags__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.tags { display: flex; flex-direction: column; gap: 0.3rem; }
.tags label { font-size: 0.85rem; font-weight: 500; }
.tags__box {
  display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center;
  padding: 0.45rem;
  border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg);
}
.tags__box--error { border-color: var(--color-error); }
.tags__box input {
  flex: 1 1 8rem; min-width: 8rem;
  border: none; background: none; color: var(--color-text);
  padding: 0.2rem; font-size: 0.9rem; outline: none;
}
.chip {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: var(--color-primary); color: var(--color-primary-contrast);
  border-radius: 999px; padding: 0.15rem 0.55rem; font-size: 0.8rem;
}
.chip__x { background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
.tags__sug { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; padding: 0; margin: 0.2rem 0 0; }
.tags__sug button {
  background: var(--color-surface); border: 1px solid var(--color-border);
  border-radius: 999px; padding: 0.12rem 0.55rem;
  color: var(--color-primary); cursor: pointer; font-size: 0.78rem;
}
.tags__hint { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
.tags__error { font-size: 0.8rem; color: var(--color-error); margin: 0; }
</style>