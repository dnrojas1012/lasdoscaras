<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '../api/admin.api'
import { viewsApi } from '../api/views.api'
import { useToastStore } from '../stores/toast.store'
import { ApiError, NetworkError } from '../api/apiClient'
import DataTable, { type Column } from '../components/ui/DataTable.vue'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import type { Category } from '../models/category.model'

// Extiende Category con el conteo, que no viene del backend: se calcula
// aparte, tal como indico el profesor.
interface CategoryRow extends Category {
  count: number
}

const toast = useToastStore()

const filas = ref<CategoryRow[]>([])
const cargando = ref(true)
const error = ref<string | null>(null)

const columnas: Column[] = [
  { key: 'name', label: 'Nombre' },
  { key: 'count', label: 'Publicaciones' },
]

function asRow(row: Record<string, unknown>): CategoryRow {
  return row as unknown as CategoryRow
}

async function cargar(): Promise<void> {
  cargando.value = true
  error.value = null
  try {
    const categorias = await adminApi.listCategories()

    // El conteo se obtiene consultando las publicaciones de cada
    // categoria por separado: es el metodo que indico el profesor,
    // porque el backend no expone un contador directo. pageSize: 1
    // porque solo interesa el numero total, no la lista completa.
    const conConteo = await Promise.all(
      categorias.map(async (c) => {
        try {
          const r = await viewsApi.list({ category: c.id, pageSize: 1 })
          return { ...c, count: r.total }
        } catch {
          return { ...c, count: 0 }
        }
      }),
    )
    filas.value = conConteo
  } catch (e) {
    error.value =
      e instanceof ApiError || e instanceof NetworkError
        ? e.message
        : 'No se pudieron cargar las categorías.'
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)

// ==================== CREAR ====================
const nombreNuevo = ref('')
const creando = ref(false)

async function crear(): Promise<void> {
  const nombre = nombreNuevo.value.trim()
  if (nombre.length < 2) {
    toast.warning('El nombre debe tener al menos 2 caracteres')
    return
  }
  if (creando.value) return
  creando.value = true
  try {
    await adminApi.createCategory({ name: nombre })
    nombreNuevo.value = ''
    toast.success('Categoría creada')
    await cargar()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible crear la categoría')
  } finally {
    creando.value = false
  }
}

// ==================== EDITAR ====================
const editandoId = ref<string | null>(null)
const nombreEdicion = ref('')

function empezarEdicion(fila: CategoryRow): void {
  editandoId.value = fila.id
  nombreEdicion.value = fila.name
}

function cancelarEdicion(): void {
  editandoId.value = null
  nombreEdicion.value = ''
}

async function guardarEdicion(): Promise<void> {
  if (editandoId.value === null) return
  const nombre = nombreEdicion.value.trim()
  if (nombre.length < 2) {
    toast.warning('El nombre debe tener al menos 2 caracteres')
    return
  }
  try {
    await adminApi.updateCategory(editandoId.value, { name: nombre })
    toast.success('Categoría actualizada')
    cancelarEdicion()
    await cargar()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible actualizar la categoría')
  }
}

// ==================== ELIMINAR ====================
const modalEliminar = ref(false)
const objetivoEliminar = ref<CategoryRow | null>(null)

function pedirEliminar(fila: CategoryRow): void {
  objetivoEliminar.value = fila
  modalEliminar.value = true
}

async function confirmarEliminar(): Promise<void> {
  if (objetivoEliminar.value === null) return
  try {
    await adminApi.deleteCategory(objetivoEliminar.value.id)
    toast.success('Categoría eliminada')
    modalEliminar.value = false
    await cargar()
  } catch (e) {
    toast.error(e instanceof ApiError ? e.message : 'No fue posible eliminar la categoría')
  }
}
</script>

<template>
  <section>
    <h1>Gestión de Categorías</h1>

    <form class="new-cat" @submit.prevent="crear">
      <label for="new-cat" class="sr-only">Nombre de la nueva categoría</label>
      <input
        id="new-cat"
        v-model="nombreNuevo"
        type="text"
        placeholder="Nombre de la nueva categoría"
        :disabled="creando"
      />
      <button type="submit" class="btn" :disabled="creando">
        {{ creando ? 'Creando…' : '+ Agregar' }}
      </button>
    </form>

    <p v-if="error" class="admin__error" role="alert">
      {{ error }} <button class="btn btn--sm" @click="cargar">Reintentar</button>
    </p>

    <DataTable
      :columns="columnas"
      :rows="filas as unknown as Record<string, unknown>[]"
      :loading="cargando"
      empty-message="Todavía no hay categorías."
    >
      <template #cell-name="{ row }">
        <input
          v-if="editandoId === asRow(row).id"
          v-model="nombreEdicion"
          type="text"
          class="edit-input"
          @keyup.enter="guardarEdicion"
          @keyup.esc="cancelarEdicion"
        />
        <span v-else>{{ asRow(row).name }}</span>
      </template>
      <template #actions="{ row }">
        <template v-if="editandoId === asRow(row).id">
          <button class="btn btn--sm" @click="guardarEdicion">Guardar</button>
          <button class="btn btn--sm btn--ghost" @click="cancelarEdicion">Cancelar</button>
        </template>
        <template v-else>
          <button class="btn btn--sm btn--ghost" @click="empezarEdicion(asRow(row))">Editar</button>
          <button class="btn btn--sm btn--danger" @click="pedirEliminar(asRow(row))">Eliminar</button>
        </template>
      </template>
    </DataTable>

    <ConfirmModal
      :open="modalEliminar"
      title="Eliminar categoría"
      :message="
        objetivoEliminar && objetivoEliminar.count > 0
          ? `Esta categoría tiene ${objetivoEliminar.count} publicaciones asociadas. Eliminarla no borra esas publicaciones. 	¿Confirma?`
          : '¿Confirma que desea eliminar esta categoría?'
      "
      confirm-text="Eliminar"
      danger
      @confirm="confirmarEliminar"
      @cancel="modalEliminar = false"
    />
  </section>
</template>

<style scoped>
h1 { font-size: 1.4rem; margin: 0 0 1rem; }
.new-cat { display: flex; gap: 0.6rem; margin-bottom: 1.2rem; flex-wrap: wrap; }
.new-cat input {
  flex: 1 1 16rem; padding: 0.55rem 0.9rem;
  border: 1px solid var(--color-border); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text);
}
.edit-input {
  padding: 0.35rem 0.6rem; border: 1px solid var(--color-primary); border-radius: 6px;
  background: var(--color-bg); color: var(--color-text); width: 100%; box-sizing: border-box;
}
.admin__error {
  color: var(--color-error); font-size: 0.88rem;
  display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1rem;
}
.btn {
  padding: 0.5rem 1rem; border: 1px solid var(--color-primary); border-radius: 6px;
  background: var(--color-primary); color: var(--color-primary-contrast); cursor: pointer; font-size: 0.88rem;
}
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn--sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; border-color: var(--color-border); background: var(--color-surface); color: var(--color-text); }
.btn--ghost { background: none; border-color: var(--color-border); color: var(--color-text); }
.btn--danger { background: var(--color-error); border-color: var(--color-error); color: #fff; }
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>