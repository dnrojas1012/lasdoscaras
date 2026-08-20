<script setup lang="ts">

import { useToastStore } from '../../stores/toast.store'

const toasts = useToastStore()

</script>

<template>

  <!-- aria-live="polite" hace que los lectores de pantalla anuncien

       los mensajes nuevos sin interrumpir lo que estén leyendo. -->

  <div class="toast-container" aria-live="polite">

    <!-- v-for repite este bloque una vez por cada aviso.

         :key le da a Vue una forma de identificar cada elemento,

         para no redibujar toda la lista cuando cambia uno solo. -->

    <div

      v-for="toast in toasts.toasts"

      :key="toast.id"

      :class="['toast', `toast--${toast.type}`]"

      :role="toast.type === 'error' ? 'alert' : 'status'"

    >

      <span>{{ toast.message }}</span>

      <button

        class="toast__close"

        aria-label="Cerrar notificación"

        @click="toasts.dismiss(toast.id)"

      >

        ×

      </button>

    </div>

  </div>

</template>

<style scoped>

.toast-container {

  position: fixed;

  top: 1rem;

  right: 1rem;

  display: flex;

  flex-direction: column;

  gap: 0.5rem;

  z-index: 1000;

  max-width: 22rem;

}

.toast {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 0.75rem;

  padding: 0.75rem 1rem;

  border-radius: 8px;

  color: #fff;

  box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);

}

.toast--success { background: var(--color-success); }

.toast--error   { background: var(--color-error); }

.toast--warning { background: var(--color-warning); color: #1a1a1a; }

.toast--info    { background: var(--color-info); }

.toast__close {

  background: none;

  border: none;

  color: inherit;

  font-size: 1.25rem;

  cursor: pointer;

  line-height: 1;

}

</style>
