<script setup lang="ts">

import { ref, onMounted, watch } from 'vue'

import { RouterLink } from 'vue-router'

import { adminApi } from '../api/admin.api'

import { viewsApi } from '../api/views.api'

import { useToastStore } from '../stores/toast.store'

import { ApiError, NetworkError } from '../api/apiClient'

import DataTable, { type Column } from '../components/ui/DataTable.vue'

import ConfirmModal from '../components/ui/ConfirmModal.vue'

import StatusBadge from '../components/ui/StatusBadge.vue'

import BasePagination from '../components/ui/BasePagination.vue'

import type { PoliticalView, ViewStatus } from '../models/view.model'

const toast = useToastStore()

const filtroEstado = ref<'' | ViewStatus>('')

const items = ref<PoliticalView[]>([])

const total = ref(0)

const pagina = ref(1)

const limite = 15

const cargando = ref(true)

const error = ref<string | null>(null)

const columnas: Column[] = [

  { key: 'title', label: 'Título' },

  { key: 'author', label: 'Autor' },

  { key: 'category', label: 'Categoría' },

  { key: 'createdAt', label: 'Fecha' },

  { key: 'status', label: 'Estado' },

]

function asView(row: Record<string, unknown>): PoliticalView {

  return row as unknown as PoliticalView

}

async function cargar(): Promise<void> {

  cargando.value = true

  error.value = null

  try {

    const data = await adminApi.listViews({

      status: filtroEstado.value || undefined,

      page: pagina.value,

      limit: limite,

    })

    items.value = data.items

    total.value = data.total

  } catch (e) {

    error.value =

      e instanceof ApiError || e instanceof NetworkError

        ? e.message

        : 'No se pudo cargar el listado de publicaciones.'

  } finally {

    cargando.value = false

  }

}

watch(filtroEstado, () => {

  pagina.value = 1

  void cargar()

})

watch(pagina, () => void cargar())

onMounted(cargar)

// ==================== DESPUBLICAR ====================

// Deliberadamente NO existe un boton de "Publicar" o "Republicar".

// El profesor respondio por escrito: si el enunciado no lo pide, no se

// implementa. Solo se ofrece despublicar contenido publicado.

const modalAbierto = ref(false)

const objetivo = ref<PoliticalView | null>(null)

const procesando = ref(false)

function pedirDespublicar(v: PoliticalView): void {

  objetivo.value = v

  modalAbierto.value = true

}

async function confirmar(): Promise<void> {

  if (objetivo.value === null || procesando.value) return

  procesando.value = true

  try {

    await viewsApi.unpublish(objetivo.value.id)

    toast.success('Publicación despublicada')

    modalAbierto.value = false

    await cargar()

  } catch (e) {

    toast.error(e instanceof ApiError ? e.message : 'No fue posible despublicar')

  } finally {

    procesando.value = false

  }

}

</script>

<template>

  <section>

    <h1>Moderación de Contenido</h1>

    <div class="toolbar">

      <label for="mod-filter">Filtrar por estado</label>

      <select id="mod-filter" v-model="filtroEstado">

        <option value="">Todas</option>

        <option value="PUBLISHED">Publicadas</option>

        <option value="UNPUBLISHED">Despublicadas</option>

      </select>

    </div>

    <p v-if="error" class="admin__error" role="alert">

      {{ error }} <button class="btn btn--sm" @click="cargar">Reintentar</button>

    </p>

    <DataTable

      :columns="columnas"

      :rows="items as unknown as Record<string, unknown>[]"

      :loading="cargando"

      empty-message="No hay publicaciones con ese filtro."

    >

      <template #cell-title="{ row }">

        <RouterLink :to="`/views/${asView(row).id}`">{{ asView(row).side?.title || '(sin título)' }}</RouterLink>

      </template>

      <template #cell-author="{ row }">{{ asView(row).author?.name }}</template>

      <template #cell-category="{ row }">{{ asView(row).category?.name }}</template>

      <template #cell-createdAt="{ row }">

        {{ new Date(asView(row).createdAt).toLocaleDateString('es-CR') }}

      </template>

      <template #cell-status="{ row }">

        <StatusBadge

          :label="asView(row).status === 'PUBLISHED' ? 'Publicada' : 'Despublicada'"

          :tone="asView(row).status === 'PUBLISHED' ? 'success' : 'neutral'"

        />

      </template>

      <template #actions="{ row }">

        <!-- Solo se puede despublicar contenido activo. No hay accion

             para una publicacion ya despublicada: no existe republicar. -->

        <button

          v-if="asView(row).status === 'PUBLISHED'"

          class="btn btn--sm btn--danger"

          @click="pedirDespublicar(asView(row))"

        >

          Despublicar

        </button>

        <span v-else class="admin__self">—</span>

      </template>

    </DataTable>

    <BasePagination :page="pagina" :total="total" :limit="limite" @change="(p) => (pagina = p)" />

    <ConfirmModal

      :open="modalAbierto"

      title="Despublicar contenido"

      :message="`&quot;${objetivo?.side?.title}&quot; dejará de ser visible para los usuarios. ¿Confirmás?`"

      confirm-text="Despublicar"

      danger

      @confirm="confirmar"

      @cancel="modalAbierto = false"

    />

  </section>

</template>

<style scoped>

h1 { font-size: 1.4rem; margin: 0 0 1rem; }

.toolbar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; }

.toolbar label { font-size: 0.85rem; color: var(--color-text-muted); }

.toolbar select {

  padding: 0.45rem; border: 1px solid var(--color-border); border-radius: 6px;

  background: var(--color-bg); color: var(--color-text);

}

.admin__error {

  color: var(--color-error); font-size: 0.88rem;

  display: flex; align-items: center; gap: 0.7rem; margin-bottom: 1rem;

}

.admin__self { color: var(--color-text-muted); }

.btn {

  padding: 0.4rem 0.9rem; border: 1px solid var(--color-border); border-radius: 6px;

  background: var(--color-surface); color: var(--color-text); cursor: pointer; font-size: 0.85rem;

}

.btn--sm { padding: 0.3rem 0.7rem; font-size: 0.8rem; }

.btn--danger { background: var(--color-error); border-color: var(--color-error); color: #fff; }

</style>
