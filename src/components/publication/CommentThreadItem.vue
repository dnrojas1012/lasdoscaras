<script setup lang="ts">
import { ref, computed } from 'vue'
import CommentItem from './CommentItem.vue'
import { commentsApi } from '../../api/comments.api'
import { useAuthStore } from '../../stores/auth.store'
import { useToastStore } from '../../stores/toast.store'
import { ApiError } from '../../api/apiClient'
import type { CommentThread, Comment } from '../../models/comment.model'

const props = defineProps<{ thread: CommentThread; viewId: string }>()

const auth = useAuthStore()
const toast = useToastStore()

const abierto = ref(false)
const comentarios = ref<Comment[]>(props.thread.comments ?? [])
const cargando = ref(false)
const texto = ref('')
const respondiendoA = ref<Comment | null>(null)
const enviando = ref(false)

const cantidad = computed(() => comentarios.value.length)

async function alternar(): Promise<void> {
  abierto.value = !abierto.value
  // Los comentarios se piden solo la primera vez que se abre el hilo.
  if (abierto.value && comentarios.value.length === 0) {
    cargando.value = true
    try {
      comentarios.value = await commentsApi.listComments(props.viewId, props.thread.id)
    } catch {
      toast.error('No fue posible cargar los comentarios')
    } finally {
      cargando.value = false
    }
  }
}

async function enviar(): Promise<void> {
  if (enviando.value) return
  if (texto.value.trim().length < 2) {
    toast.warning('El comentario no puede estar vacío')
    return
  }
  enviando.value = true
  try {
    await commentsApi.createComment(props.viewId, props.thread.id, {
      content: texto.value.trim(),
      ...(respondiendoA.value ? { parentId: respondiendoA.value.id } : {}),
    })
    texto.value = ''
    respondiendoA.value = null
    comentarios.value = await commentsApi.listComments(props.viewId, props.thread.id)
    toast.success('Comentario publicado')
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible publicar el comentario')
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <article class="thread">
    <button class="thread__toggle" :aria-expanded="abierto" @click="alternar">
      <span class="thread__arrow" :class="{ 'thread__arrow--open': abierto }">▸</span>
      <span class="thread__title">{{ thread.title ?? 'Hilo de discusión' }}</span>
      <span class="thread__count">{{ cantidad }}</span>
    </button>

    <div v-if="abierto" class="thread__body">
      <p v-if="cargando" class="thread__loading">Cargando comentarios…</p>

      <ul v-else-if="comentarios.length" class="thread__list">
        <CommentItem
          v-for="c in comentarios"
          :key="c.id"
          :comment="c"
          :nivel="0"
          @reply="(x) => (respondiendoA = x)"
        />
      </ul>

      <p v-else class="thread__empty">Todavía no hay comentarios en este hilo.</p>

      <div v-if="auth.isAuthenticated" class="thread__form">
        <p v-if="respondiendoA" class="thread__replying">
          Respondiendo a <strong>{{ respondiendoA.author?.name }}</strong>
          <button @click="respondiendoA = null">cancelar</button>
        </p>

        <label :for="`c-${thread.id}`" class="sr-only">Escribir un comentario</label>
        <textarea
          :id="`c-${thread.id}`"
          v-model="texto"
          rows="3"
          placeholder="Escribí tu comentario…"
        ></textarea>

        <!-- Advertencia de moderacion, requerida por el enunciado. -->
        <p class="thread__warn">
          Los comentarios son revisados automáticamente. El contenido ofensivo puede ser removido.
        </p>

        <button class="thread__send" :disabled="enviando" @click="enviar">
          {{ enviando ? 'Enviando…' : 'Publicar comentario' }}
        </button>
      </div>

      <p v-else class="thread__login">
        <RouterLink to="/login">Iniciá sesión</RouterLink> para participar en la discusión.
      </p>
    </div>
  </article>
</template>

<style scoped>
.thread { border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 0.7rem; }
.thread__toggle {
  width: 100%; display: flex; align-items: center; gap: 0.6rem;
  padding: 0.8rem 1rem; background: var(--color-surface);
  border: none; border-radius: 8px; cursor: pointer;
  color: var(--color-text); text-align: left; font-size: 0.95rem;
}
.thread__arrow { transition: transform 0.15s ease; display: inline-block; }
.thread__arrow--open { transform: rotate(90deg); }
.thread__title { flex: 1; font-weight: 600; }
.thread__count {
  background: var(--color-primary); color: var(--color-primary-contrast);
  border-radius: 999px; padding: 0.05rem 0.5rem; font-size: 0.75rem;
}
.thread__body { padding: 0 1rem 1rem; }
.thread__list { list-style: none; padding: 0; margin: 0; }
.thread__empty, .thread__loading, .thread__login { color: var(--color-text-muted); font-size: 0.9rem; }
.thread__form { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.thread__form textarea {
  width: 100%; padding: 0.6rem;
  border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text);
  font-family: inherit; resize: vertical;
}
.thread__warn { font-size: 0.75rem; color: var(--color-text-muted); margin: 0; }
.thread__replying { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; }
.thread__replying button { background: none; border: none; color: var(--color-primary); cursor: pointer; }
.thread__send {
  align-self: flex-start;
  padding: 0.5rem 1.1rem;
  background: var(--color-primary); color: var(--color-primary-contrast);
  border: none; border-radius: 6px; cursor: pointer;
}
.thread__send:disabled { opacity: 0.6; cursor: not-allowed; }
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>