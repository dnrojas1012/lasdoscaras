<script setup lang="ts">
import { computed } from 'vue'
import type { Comment } from '../../models/comment.model'

const props = defineProps<{ comment: Comment; nivel?: number }>()
const emit = defineEmits<{ (e: 'reply', comentario: Comment): void }>()

const fecha = computed(() =>
  new Date(props.comment.createdAt).toLocaleString('es-CR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }),
)

// Respuestas de un solo nivel.
const puedeResponder = computed(() => (props.nivel ?? 0) === 0)
</script>

<template>
  <li class="comment" :class="{ 'comment--reply': (nivel ?? 0) > 0 }">
    <div class="comment__head">
      <strong>{{ comment.author?.name ?? 'Anónimo' }}</strong>
      <time>{{ fecha }}</time>
    </div>
    <p class="comment__body">{{ comment.content }}</p>

    <button v-if="puedeResponder" class="comment__reply" @click="emit('reply', comment)">
      Responder
    </button>

    <!-- Un componente que se usa a si mismo se llama recursivo.
         Aca solo baja un nivel, porque el enunciado no pide mas. -->
    <ul v-if="comment.replies?.length" class="comment__replies">
      <CommentItem
        v-for="hijo in comment.replies"
        :key="hijo.id"
        :comment="hijo"
        :nivel="(nivel ?? 0) + 1"
      />
    </ul>
  </li>
</template>

<style scoped>
.comment {
  padding: 0.8rem 0;
  border-bottom: 1px solid var(--color-border);
  list-style: none;
}
.comment--reply {
  border-left: 2px solid var(--color-border);
  padding-left: 0.9rem;
  border-bottom: none;
}
.comment__head { display: flex; gap: 0.7rem; align-items: baseline; font-size: 0.85rem; }
.comment__head time { color: var(--color-text-muted); font-size: 0.78rem; }
.comment__body { margin: 0.35rem 0; line-height: 1.55; white-space: pre-line; }
.comment__reply {
  background: none; border: none; padding: 0;
  color: var(--color-primary); cursor: pointer; font-size: 0.8rem;
}
.comment__replies { list-style: none; padding: 0 0 0 0.5rem; margin: 0.6rem 0 0; }
</style>