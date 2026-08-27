<script setup lang="ts">
export interface Column {
  key: string
  label: string
}

defineProps<{
  columns: Column[]
  // unknown en vez de any: obliga a comprobar el tipo antes de usarlo
  rows: Array<Record<string, unknown>>
  loading?: boolean
  emptyMessage?: string
}>()
</script>

<template>
  <div class="table-wrap">
    <table class="table">
      <thead>
        <tr>
          <th v-for="c in columns" :key="c.key" scope="col">{{ c.label }}</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td :colspan="columns.length + 1" class="table__msg">Cargando…</td>
        </tr>
        <tr v-else-if="rows.length === 0">
          <td :colspan="columns.length + 1" class="table__msg">
            {{ emptyMessage ?? 'No hay registros para mostrar.' }}
          </td>
        </tr>
        <tr v-for="(row, i) in rows" v-else :key="String(row.id ?? i)">
          <td v-for="c in columns" :key="c.key" :data-label="c.label">
            <!-- Un slot con nombre por columna: quien usa la tabla decide
                 como se ve cada celda. Si no define nada, se muestra el valor. -->
            <slot :name="`cell-${c.key}`" :row="row">{{ row[c.key] ?? '—' }}</slot>
          </td>
          <td data-label="Acciones">
            <slot name="actions" :row="row" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap { overflow-x: auto; border: 1px solid var(--color-border); border-radius: 10px; }
.table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
.table th, .table td { padding: 0.7rem 0.9rem; text-align: left; }
.table thead th {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  font-size: 0.78rem; text-transform: uppercase;
  color: var(--color-text-muted);
}

.table tbody tr { border-bottom: 1px solid var(--color-border); }
.table__msg { text-align: center; color: var(--color-text-muted); padding: 2rem; }
/* En celular la tabla se convierte en tarjetas apiladas.
   Cada celda muestra su etiqueta gracias al atributo data-label. */
@media (max-width: 700px) {
  .table thead { display: none; }
  .table, .table tbody, .table tr, .table td { display: block; width: 100%; }
  .table tr { padding: 0.7rem 0; }
  .table td { display: flex; justify-content: space-between; gap: 1rem; padding: 0.35rem 0.9rem; }
  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-muted);
    font-size: 0.78rem;
  }
}

</style>