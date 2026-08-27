<script setup lang="ts">

import { ref, onMounted, watch } from 'vue'

import { adminApi } from '../api/admin.api'

import { useAuthStore } from '../stores/auth.store'

import { useToastStore } from '../stores/toast.store'

import { useDebounce } from '../composables/useDebounce'

import { ApiError, NetworkError } from '../api/apiClient'

import DataTable, { type Column } from '../components/ui/DataTable.vue'

import ConfirmModal from '../components/ui/ConfirmModal.vue'

import StatusBadge from '../components/ui/StatusBadge.vue'

import BasePagination from '../components/ui/BasePagination.vue'

import type { User } from '../models/user.model'

const auth = useAuthStore()

const toast = useToastStore()

const busqueda = ref('')

// Mismo debounce de 300 ms que el resto del proyecto.

const busquedaDebounced = useDebounce(busqueda, 300)

const usuarios = ref<User[]>([])

const total = ref(0)

const pagina = ref(1)

const limite = 15

const cargando = ref(true)

const error = ref<string | null>(null)

const columnas: Column[] = [

  { key: 'name', label: 'Nombre' },

  { key: 'email', label: 'Correo' },

  { key: 'role', label: 'Rol' },

  { key: 'status', label: 'Estado' },

  { key: 'createdAt', label: 'Registro' },

]

// DataTable trabaja con filas genericas (Record<string, unknown>) porque

// es un componente compartido que no conoce el dominio. Este helper

// devuelve la fila con su tipo real, para poder acceder a sus campos

// con seguridad de tipos dentro de esta pantalla en particular.

function asUser(row: Record<string, unknown>): User {

  return row as unknown as User

}

// El API no documenta el nombre exacto del campo de baneo en su

// respuesta (no hay un ejemplo de esa ruta en la coleccion de Postman).

// Se contemplan las dos formas mas probables -un booleano 'banned' o un

// texto 'status: BANNED'- en lugar de apostar a una sola.

function estaBaneado(u: User & { banned?: boolean; status?: string }): boolean {

  if (typeof u.banned === 'boolean') return u.banned

  return u.status === 'BANNED'

}

async function cargar(): Promise<void> {

  cargando.value = true

  error.value = null

  try {

  const data = await adminApi.listUsers({
    search: busquedaDebounced.value || undefined,
    page: pagina.value,
    pageSize: limite,
  })

    usuarios.value = data.items

    total.value = data.total

  } catch (e) {

    error.value =

      e instanceof ApiError || e instanceof NetworkError

        ? e.message

        : 'No se pudo cargar la lista de usuarios.'

  } finally {

    cargando.value = false

  }

}

watch(busquedaDebounced, () => {

  pagina.value = 1

  void cargar()

})

watch(pagina, () => void cargar())

onMounted(cargar)

// ==================== BANEAR / DESBANEAR ====================

const modalAbierto = ref(false)

const usuarioObjetivo = ref<User | null>(null)

const accionObjetivo = ref<'ban' | 'unban'>('ban')

const procesando = ref(false)

function pedirConfirmacion(u: User, accion: 'ban' | 'unban'): void {

  usuarioObjetivo.value = u

  accionObjetivo.value = accion

  modalAbierto.value = true

}

async function confirmar(): Promise<void> {

  if (usuarioObjetivo.value === null || procesando.value) return

  procesando.value = true

  try {

    if (accionObjetivo.value === 'ban') {

      await adminApi.banUser(usuarioObjetivo.value.id)

      toast.success(`${usuarioObjetivo.value.name} fue baneado`)

    } else {

      await adminApi.unbanUser(usuarioObjetivo.value.id)

      toast.success(`${usuarioObjetivo.value.name} fue desbaneado`)

    }

    modalAbierto.value = false

    await cargar()

  } catch (e) {

    toast.error(e instanceof ApiError ? e.message : 'No fue posible completar la acción')

  } finally {

    procesando.value = false

  }

}

</script>

<template>

  <section>

    <h1>Gestión de Usuarios</h1>

    <div class="toolbar">

      <label for="u-search" class="sr-only">Buscar por nombre o correo</label>

      <input id="u-search" v-model="busqueda" type="search" placeholder="Buscar por nombre o correo…" />

    </div>

    <p v-if="error" class="admin__error" role="alert">

      {{ error }} <button class="btn btn--sm" @click="cargar">Reintentar</button>

    </p>

    <DataTable

      :columns="columnas"

      :rows="usuarios as unknown as Record<string, unknown>[]"

      :loading="cargando"

      empty-message="No se encontraron usuarios con ese criterio."

    >

      <template #cell-role="{ row }">

        {{ asUser(row).role === 'SUPERADMIN' ? 'Superadmin' : 'Usuario' }}

      </template>

      <template #cell-status="{ row }">

        <StatusBadge

          :label="estaBaneado(asUser(row)) ? 'Baneado' : 'Activo'"

          :tone="estaBaneado(asUser(row)) ? 'danger' : 'success'"

        />

      </template>

      <template #cell-createdAt="{ row }">

        {{ new Date(asUser(row).createdAt).toLocaleDateString('es-CR') }}

      </template>

      <template #actions="{ row }">

        <!-- El superadmin no puede banearse a si mismo: se compara el id

             de la fila contra el usuario autenticado, no contra el rol,

             porque podria haber mas de un superadmin en el sistema. -->

        <button

          v-if="asUser(row).id !== auth.user?.id"

          class="btn btn--sm"

          :class="{ 'btn--danger': !estaBaneado(asUser(row)) }"

          @click="pedirConfirmacion(asUser(row), estaBaneado(asUser(row)) ? 'unban' : 'ban')"

        >

          {{ estaBaneado(asUser(row)) ? 'Desbanear' : 'Banear' }}

        </button>

        <span v-else class="admin__self" title="No puede banearse a sí mismo">—</span>

      </template>

    </DataTable>

    <BasePagination :page="pagina" :total="total" :limit="limite" @change="(p) => (pagina = p)" />

    <ConfirmModal

      :open="modalAbierto"

      :title="accionObjetivo === 'ban' ? 'Banear usuario' : 'Desbanear usuario'"

      :message="

        accionObjetivo === 'ban'

          ? `${usuarioObjetivo?.name} no va a poder iniciar sesión hasta que se le desbanee. 	¿Confirma?`

          : `${usuarioObjetivo?.name} va a recuperar el acceso a su cuenta. ¿Confirma?`

      "

      :confirm-text="accionObjetivo === 'ban' ? 'Banear' : 'Desbanear'"

      :danger="accionObjetivo === 'ban'"

      @confirm="confirmar"

      @cancel="modalAbierto = false"

    />

  </section>

</template>

<style scoped>

h1 { font-size: 1.4rem; margin: 0 0 1rem; }

.toolbar { margin-bottom: 1rem; }

.toolbar input {

  width: 100%; max-width: 24rem; padding: 0.55rem 0.9rem;

  border: 1px solid var(--color-border); border-radius: 999px;

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

.sr-only {

  position: absolute; width: 1px; height: 1px;

  padding: 0; margin: -1px; overflow: hidden;

  clip: rect(0,0,0,0); white-space: nowrap; border: 0;

}

</style>
