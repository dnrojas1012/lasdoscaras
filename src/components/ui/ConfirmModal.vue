<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmText?: string
  danger?: boolean
}>()

const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()
const confirmBtn = ref<HTMLButtonElement | null>(null)

// Al abrirse, el foco salta al boton de confirmar.
// Sin esto, quien navega por teclado se queda perdido detras del modal.
watch(
  () => props.open,
  async (abierto) => {
    if (abierto) {
      await nextTick()
      confirmBtn.value?.focus()
    }
  },
)
</script>

<template>
  <!-- .self: el clic solo cierra si cayo directo sobre el fondo oscuro,
       no si vino de un elemento de adentro del modal que hizo bubbling. -->
  <div v-if="open" class="overlay" @click.self="emit('cancel')" @keydown.esc="emit('cancel')">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="title">
      <h2 class="modal__title">{{ title }}</h2>
      <p class="modal__msg">{{ message }}</p>
      <div class="modal__actions">
        <button class="btn btn--ghost" @click="emit('cancel')">Cancelar</button>
        <button
          ref="confirmBtn"
          class="btn"
          :class="{ 'btn--danger': danger }"
          @click="emit('confirm')"
        >
          {{ confirmText ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem; z-index: 900;
}
.modal {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  width: 100%; max-width: 26rem;
}
.modal__title { margin: 0 0 0.6rem; font-size: 1.1rem; }
.modal__msg { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 1.4rem; }
.modal__actions { display: flex; justify-content: flex-end; gap: 0.6rem; }
.btn {
  padding: 0.5rem 1.1rem; border: none; border-radius: 6px; cursor: pointer;
  background: var(--color-primary); color: var(--color-primary-contrast);
}
.btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text); }
.btn--danger { background: var(--color-error); }
</style>