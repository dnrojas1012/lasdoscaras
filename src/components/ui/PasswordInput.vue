<script setup lang="ts">

import { ref, computed } from 'vue'

const props = defineProps<{

  id: string

  label: string

  modelValue: string

  error?: string | null

  autocomplete?: string

  disabled?: boolean

  // Solo se muestra el medidor en el registro, no en el login.

  showStrength?: boolean

}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const visible = ref(false)

const tieneError = computed(() => typeof props.error === 'string' && props.error.length > 0)

// Medidor simple: suma un punto por cada criterio cumplido.

const fuerza = computed(() => {

  const v = props.modelValue

  let puntos = 0

  if (v.length >= 8) puntos++

  if (/[A-Z]/.test(v)) puntos++

  if (/[a-z]/.test(v)) puntos++

  if (/[0-9]/.test(v)) puntos++

  if (/[^A-Za-z0-9]/.test(v)) puntos++

  return puntos

})

const nivel = computed(() => {

  if (props.modelValue.length === 0) return { texto: '', clase: '', ancho: '0%' }

  if (fuerza.value <= 2) return { texto: 'Débil', clase: 'weak', ancho: '33%' }

  if (fuerza.value <= 3) return { texto: 'Media', clase: 'medium', ancho: '66%' }

  return { texto: 'Fuerte', clase: 'strong', ancho: '100%' }

})

</script>

<template>

  <div class="field">

    <label :for="id">{{ label }}</label>

    <div class="field__wrap">

      <input

        :id="id"

        :type="visible ? 'text' : 'password'"

        :value="modelValue"

        :autocomplete="autocomplete"

        :disabled="disabled"

        :class="{ 'field__input--error': tieneError }"

        :aria-invalid="tieneError"

        :aria-describedby="tieneError ? `${id}-error` : undefined"

        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"

      />

      <button

        type="button"

        class="field__toggle"

        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"

        @click="visible = !visible"

      >

        {{ visible ? '🙈' : '👁' }}

      </button>

    </div>

    <div v-if="showStrength && modelValue.length > 0" class="strength">

      <div class="strength__bar">

        <div :class="['strength__fill', `strength__fill--${nivel.clase}`]" :style="{ width: nivel.ancho }"></div>

      </div>

      <span :class="['strength__text', `strength__text--${nivel.clase}`]">{{ nivel.texto }}</span>

    </div>

    <p v-if="tieneError" :id="`${id}-error`" class="field__error" role="alert">{{ error }}</p>

  </div>

</template>

<style scoped>

.field { display: flex; flex-direction: column; gap: 0.3rem; }

.field label { font-size: 0.85rem; font-weight: 500; }

.field__wrap { position: relative; display: flex; }

.field__wrap input {

  flex: 1;

  padding: 0.6rem 2.5rem 0.6rem 0.75rem;

  border: 1px solid var(--color-border);

  border-radius: 6px;

  background: var(--color-bg);

  color: var(--color-text);

  font-size: 0.95rem;

}

.field__input--error { border-color: var(--color-error); }

.field__toggle {

  position: absolute; right: 0.4rem; top: 50%;

  transform: translateY(-50%);

  background: none; border: none; cursor: pointer; font-size: 1rem;

}

.field__error { font-size: 0.8rem; color: var(--color-error); margin: 0; }

.strength { display: flex; align-items: center; gap: 0.5rem; }

.strength__bar { flex: 1; height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }

.strength__fill { height: 100%; transition: width 0.2s ease; }

.strength__fill--weak { background: var(--color-error); }

.strength__fill--medium { background: var(--color-warning); }

.strength__fill--strong { background: var(--color-success); }

.strength__text { font-size: 0.75rem; }

.strength__text--weak { color: var(--color-error); }

.strength__text--medium { color: var(--color-warning); }

.strength__text--strong { color: var(--color-success); }

</style>
