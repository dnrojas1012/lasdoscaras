<script setup lang="ts">
import ReactionBar from './ReactionBar.vue'
import SourceList from './SourceList.vue'
import type { ViewSide } from '../../models/view.model'

defineProps<{
  side: ViewSide
  // 'a' es la Postura, 'b' la Contrapostura. Solo cambia el color y el titulo.
  variant: 'a' | 'b'
  etiqueta: string
  myReaction: 'LIKE' | 'DISLIKE' | null
  disabled?: boolean
  canReact: boolean
}>()

const emit = defineEmits<{ (e: 'react', tipo: 'like' | 'dislike'): void }>()
</script>

<template>
  <section class="panel" :class="`panel--${variant}`">
    <span class="panel__tag">{{ etiqueta }}</span>
    <h2 class="panel__title">{{ side.title }}</h2>
    <p class="panel__text">{{ side.description }}</p>

    <SourceList :sources="side.sources ?? []" />

    <footer class="panel__foot">
      <ReactionBar
        :likes="side.likes ?? 0"
        :dislikes="side.dislikes ?? 0"
        :my-reaction="myReaction"
        :disabled="disabled"
        :can-react="canReact"
        @react="(t) => emit('react', t)"
      />
    </footer>
  </section>
</template>

<style scoped>
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 5px solid;
  border-radius: 10px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
}
.panel--a { border-left-color: var(--color-side-a); }
.panel--b { border-left-color: var(--color-side-b); }

.panel__tag {
  display: inline-block;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.panel--a .panel__tag { color: var(--color-side-a); }
.panel--b .panel__tag { color: var(--color-side-b); }

.panel__title { font-size: 1.15rem; margin: 0 0 0.7rem; line-height: 1.35; }
.panel__text { color: var(--color-text); line-height: 1.65; margin: 0; white-space: pre-line; }
.panel__foot { margin-top: auto; padding-top: 1.2rem; }
</style>