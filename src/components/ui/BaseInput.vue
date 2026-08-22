<script setup lang="ts">

import { computed } from 'vue'

const props = defineProps<{

  id: string

  label: string

  modelValue: string

  type?: string

  placeholder?: string

  // El mensaje de error de ESTE campo. Viene del padre.
 error?: string | null

  hint?: string

  autocomplete?: string

  disabled?: boolean

}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const tieneError = computed(() => typeof props.error === 'string' && props.error.length > 0)

function onInput(event: Event): void {

  emit('update:modelValue', (event.target as HTMLInputElement).value)

}

</script>

<template>

  <div class="field">

    <!-- El label SIEMPRE asociado al input con for/id.

         Es requisito de accesibilidad del enunciado. -->

    <label :for="id">{{ label }}</label>

    <input

      :id="id"

      :type="type ?? 'text'"
  :value="modelValue"

      :placeholder="placeholder"

      :autocomplete="autocomplete"

      :disabled="disabled"

      :class="{ 'field__input--error': tieneError }"

      :aria-invalid="tieneError"

      :aria-describedby="tieneError ? `${id}-error` : hint ? `${id}-hint` : undefined"

      @input="onInput"

    />

    <p v-if="hint && !tieneError" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>

    <!-- role="alert" hace que el lector de pantalla anuncie el error
 apenas aparece. -->

    <p v-if="tieneError" :id="`${id}-error`" class="field__error" role="alert">

      {{ error }}

    </p>

  </div>

</template>

<style scoped>

.field { display: flex; flex-direction: column; gap: 0.3rem; }

.field label { font-size: 0.85rem; font-weight: 500; }

.field input {

  padding: 0.6rem 0.75rem;
  border: 1px solid var(--color-border);

  border-radius: 6px;

  background: var(--color-bg);

  color: var(--color-text);

  font-size: 0.95rem;

}

.field input:disabled { opacity: 0.6; }

.field__input--error { border-color: var(--color-error); }

.field__hint { font-size: 0.78rem; color: var(--color-text-muted); margin: 0; }

.field__error { font-size: 0.8rem; color: var(--color-error); margin: 0; }

</style>
