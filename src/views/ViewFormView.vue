<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { viewsApi } from '../api/views.api'
import { categoriesApi } from '../api/categories.api'
import { cacheService, CACHE_KEYS } from '../services/cacheService'
import { useToastStore } from '../stores/toast.store'
import { ApiError, NetworkError } from '../api/apiClient'
import SideEditor, { type SideDraft } from '../components/publication/SideEditor.vue'
import TagInput from '../components/publication/TagInput.vue'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import type { Category } from '../models/category.model'
import type { SourceDraft } from '../components/publication/SourceEditor.vue'

const route = useRoute()
const router = useRouter()
const toast = useToastStore()

// La misma pantalla sirve para crear y para editar.
// Se distingue por la presencia del parametro :id en la ruta.
const editando = computed(() => typeof route.params.id === 'string' && route.params.id.length > 0)
const idActual = computed(() => String(route.params.id ?? ''))

interface FormData {
  categoryId: string
  side: SideDraft
  counterpart: SideDraft
  hashtags: string[]
}

function ladoVacio(): SideDraft {
  return { title: '', description: '', sources: [{ type: 'LINK', url: '', label: '' }] }
}

const form = ref<FormData>({
  categoryId: '',
  side: ladoVacio(),
  counterpart: ladoVacio(),
  hashtags: [],
})

const categorias = ref<Category[]>([])
const cargando = ref(true)
const enviando = ref(false)
const errorCarga = ref<string | null>(null)

const errores = ref<{ general: Record<string, string>; side: Record<string, string>; counterpart: Record<string, string> }>({
  general: {}, side: {}, counterpart: {},
})

// Se compara contra el estado inicial para saber si hay cambios sin guardar.
const inicial = ref('')
const hayCambios = computed(() => JSON.stringify(form.value) !== inicial.value)

const modalSalir = ref(false)
const salidaConfirmada = ref(false)
let destinoPendiente: string | null = null

const MIN_DESC = 100

// ==================== BORRADOR ====================
// Se guarda automaticamente. No hay boton: recordar guardar un borrador
// es una tarea que el usuario no deberia tener que hacer.
// Solo aplica al modo crear: en edicion el contenido real esta en el API.
const mostrarRestaurar = ref(false)

watch(
  form,
  (valor) => {
    if (!editando.value && !cargando.value) {
      cacheService.set(CACHE_KEYS.draft, valor)
    }
  },
  { deep: true },
)

function restaurarBorrador(): void {
  const guardado = cacheService.get<FormData>(CACHE_KEYS.draft)
  if (guardado !== null) {
    form.value = guardado
    toast.info('Borrador restaurado')
  }
  mostrarRestaurar.value = false
}

function descartarBorrador(): void {
  cacheService.remove(CACHE_KEYS.draft)
  mostrarRestaurar.value = false
}

// ==================== CARGA ====================
onMounted(async () => {
  try {
    categorias.value = await categoriesApi.list()
  } catch {
    categorias.value = []
    toast.warning('No se pudieron cargar las categorías')
  }

  if (editando.value) {
    try {
      const vista = await viewsApi.getById(idActual.value)
      form.value = {
        categoryId: vista.category?.id ?? '',
        side: {
          title: vista.side.title,
          description: vista.side.description,
          sources: vista.side.sources.map((s) => ({
            type: s.type, url: s.url, label: s.label ?? '',
          })) as SourceDraft[],
        },
        counterpart: {
          title: vista.counterpart.title,
          description: vista.counterpart.description,
          sources: vista.counterpart.sources.map((s) => ({
            type: s.type, url: s.url, label: s.label ?? '',
          })) as SourceDraft[],
        },
        hashtags: vista.hashtags.map((h) => h.name),
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        void router.replace({ name: 'not-found' })
        return
      }
      errorCarga.value = e instanceof ApiError || e instanceof NetworkError
        ? e.message
        : 'No se pudo cargar la publicación.'
    }
  } else {
    // Solo se ofrece restaurar si el borrador tiene algo escrito.
    const guardado = cacheService.get<FormData>(CACHE_KEYS.draft)
    if (guardado !== null && (guardado.side?.title || guardado.side?.description)) {
      mostrarRestaurar.value = true
    }
  }

  cargando.value = false
  inicial.value = JSON.stringify(form.value)
})

// ==================== VALIDACION ====================
function validarLado(lado: SideDraft): Record<string, string> {
  const e: Record<string, string> = {}
  if (lado.title.trim().length < 5) {
    e.title = 'El título debe tener al menos 5 caracteres'
  }
  if (lado.description.trim().length < MIN_DESC) {
    e.description = `El argumento debe tener al menos ${MIN_DESC} caracteres`
  }
  const validas = lado.sources.filter((s) => s.url.trim().length > 0)
  if (validas.length === 0) {
    e.sources = 'Debe incluir al menos una fuente con URL'
  }
  return e
}

function validar(): boolean {
  errores.value = { general: {}, side: {}, counterpart: {} }

  if (form.value.categoryId.length === 0) {
    errores.value.general.categoryId = 'Seleccioná una categoría'
  }
  errores.value.side = validarLado(form.value.side)
  errores.value.counterpart = validarLado(form.value.counterpart)

  return (
    Object.keys(errores.value.general).length === 0 &&
    Object.keys(errores.value.side).length === 0 &&
    Object.keys(errores.value.counterpart).length === 0
  )
}

// ==================== ENVIO ====================
function limpiarLado(lado: SideDraft) {
  return {
    title: lado.title.trim(),
    description: lado.description.trim(),
    // Se descartan las fuentes sin URL y se omite el label vacio.
    sources: lado.sources
      .filter((s) => s.url.trim().length > 0)
      .map((s) => ({
        type: s.type,
        url: s.url.trim(),
        ...(s.label.trim().length > 0 ? { label: s.label.trim() } : {}),
      })),
  }
}

async function enviar(): Promise<void> {
  if (enviando.value) return

  if (!validar()) {
    toast.warning('Revisá los campos marcados en rojo')
    // Lleva el foco al primer error, para que no quede fuera de pantalla.
    const primero = document.querySelector('[aria-invalid="true"]')
    if (primero instanceof HTMLElement) primero.focus()
    return
  }

  enviando.value = true
  try {
    const payload = {
      categoryId: form.value.categoryId,
      side: limpiarLado(form.value.side),
      counterpart: limpiarLado(form.value.counterpart),
      hashtags: form.value.hashtags,
    }

    const resultado = editando.value
      ? await viewsApi.update(idActual.value, payload)
      : await viewsApi.create(payload)

    // El borrador ya cumplio su funcion.
    cacheService.remove(CACHE_KEYS.draft)
    salidaConfirmada.value = true

    toast.success(editando.value ? 'Publicación actualizada' : 'Publicación creada')
    void router.push({ name: 'view-detail', params: { id: resultado.id } })
  } catch (e) {
    if (e instanceof ApiError) {
      // Los errores por campo que devuelve Zod se reparten en su seccion.
      // El API usa 'side' y 'counterpart' como prefijo del path.
      const campos = e.fieldErrors
      if (Object.keys(campos).length > 0) {
        for (const [clave, mensaje] of Object.entries(campos)) {
          if (clave === 'categoryId') errores.value.general.categoryId = mensaje
          else if (clave === 'title' || clave === 'description') {
            errores.value.side[clave] = mensaje
            errores.value.counterpart[clave] = mensaje
          } else errores.value.general[clave] = mensaje
        }
        toast.error('El servidor rechazó algunos campos')
      } else {
        toast.error(e.message)
      }
    } else if (e instanceof NetworkError) {
      toast.error(e.message)
    } else {
      toast.error('Ocurrió un error inesperado al guardar')
    }
  } finally {
    enviando.value = false
  }
}

// ==================== SALIDA ====================
function intentarSalir(): void {
  if (hayCambios.value) {
    destinoPendiente = editando.value ? `/views/${idActual.value}` : '/'
    modalSalir.value = true
  } else {
    void router.push(editando.value ? `/views/${idActual.value}` : '/')
  }
}

function confirmarSalida(): void {
  modalSalir.value = false
  salidaConfirmada.value = true
  void router.push(destinoPendiente ?? '/')
}

// Guard local: intercepta CUALQUIER intento de salir de la pantalla,
// incluido el boton Atras del navegador y los enlaces de la barra.
onBeforeRouteLeave((to) => {
  if (!hayCambios.value || salidaConfirmada.value) return true
  destinoPendiente = to.fullPath
  modalSalir.value = true
  return false
})
</script>

<template>
  <div v-if="cargando" class="form__loading">Cargando…</div>

  <div v-else-if="errorCarga" class="form__loading">
    <p>{{ errorCarga }}</p>
    <RouterLink to="/">Volver al inicio</RouterLink>
  </div>

  <section v-else class="form">
    <header class="form__head">
      <h1>{{ editando ? 'Editar publicación' : 'Nueva publicación' }}</h1>
      <p class="form__intro">
        Toda publicación debe presentar las dos caras del tema: una postura y su
        contrapostura, cada una con sus propios argumentos y fuentes.
      </p>
    </header>

    <!-- Restauracion de borrador -->
    <div v-if="mostrarRestaurar" class="draft" role="status">
      <span>Tenés un borrador sin publicar. ¿Querés recuperarlo?</span>
      <div class="draft__actions">
        <button type="button" class="btn btn--sm" @click="restaurarBorrador">Restaurar</button>
        <button type="button" class="btn btn--sm btn--ghost" @click="descartarBorrador">Descartar</button>
      </div>
    </div>

    <form @submit.prevent="enviar">
      <div class="field">
        <label for="f-cat">Categoría</label>
        <select
          id="f-cat"
          v-model="form.categoryId"
          :disabled="enviando"
          :class="{ 'field--err': errores.general.categoryId }"
          :aria-invalid="Boolean(errores.general.categoryId)"
        >
          <option value="">Seleccioná una categoría</option>
          <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <p v-if="errores.general.categoryId" class="field__err" role="alert">
          {{ errores.general.categoryId }}
        </p>
      </div>

      <TagInput
        v-model="form.hashtags"
        :disabled="enviando"
        :error="errores.general.hashtags"
      />

      <div class="form__sides">
        <SideEditor
          v-model="form.side"
          variant="a"
          etiqueta="Postura · Lado A"
          ayuda="Los argumentos a favor del tema."
          id-prefix="side-a"
          :errores="errores.side"
          :disabled="enviando"
        />
        <SideEditor
          v-model="form.counterpart"
          variant="b"
          etiqueta="Contrapostura · Lado B"
          ayuda="Los argumentos en contra del tema."
          id-prefix="side-b"
          :errores="errores.counterpart"
          :disabled="enviando"
        />
      </div>

      <footer class="form__foot">
        <button type="button" class="btn btn--ghost" :disabled="enviando" @click="intentarSalir">
          Cancelar
        </button>
        <button type="submit" class="btn" :disabled="enviando">
          {{ enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Publicar' }}
        </button>
      </footer>
    </form>

    <ConfirmModal
      :open="modalSalir"
      title="Salir sin guardar"
      message="Tenés cambios sin guardar. Si salís ahora se perderán los que no estén en el borrador."
      confirm-text="Salir sin guardar"
      danger
      @confirm="confirmarSalida"
      @cancel="modalSalir = false"
    />
  </section>
</template>

<style scoped>
.form__loading { padding: 3rem; text-align: center; color: var(--color-text-muted); }
.form { max-width: 52rem; margin: 0 auto; }
.form__head h1 { font-size: 1.5rem; margin: 0 0 0.4rem; }
.form__intro { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 1.4rem; }

.draft {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  flex-wrap: wrap;
  background: color-mix(in srgb, var(--color-info) 12%, transparent);
  border: 1px solid var(--color-info); border-radius: 8px;
  padding: 0.7rem 1rem; margin-bottom: 1.4rem; font-size: 0.88rem;
}
.draft__actions { display: flex; gap: 0.5rem; }

form { display: flex; flex-direction: column; gap: 1.4rem; }

.field { display: flex; flex-direction: column; gap: 0.25rem; }
.field label { font-size: 0.85rem; font-weight: 500; }
.field select {
  padding: 0.55rem; border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text); font-size: 0.92rem;
}
.field--err { border-color: var(--color-error); }
.field__err { font-size: 0.8rem; color: var(--color-error); margin: 0; }

/* Mobile-first: los dos lados se apilan y van lado a lado desde 900px. */
.form__sides { display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
@media (min-width: 900px) {
  .form__sides { grid-template-columns: 1fr 1fr; }
}

.form__foot {
  display: flex; justify-content: flex-end; gap: 0.7rem;
  border-top: 1px solid var(--color-border); padding-top: 1.2rem;
}
.btn {
  padding: 0.6rem 1.4rem; border: none; border-radius: 6px; cursor: pointer;
  background: var(--color-primary); color: var(--color-primary-contrast); font-size: 0.92rem;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text); }
.btn--sm { padding: 0.35rem 0.8rem; font-size: 0.82rem; }
</style>