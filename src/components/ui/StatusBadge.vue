<script setup lang="ts">

defineProps<{

  label: string

  tone: 'success' | 'danger' | 'warning' | 'neutral'

}>()

</script>

<template>

  <span class="badge" :class="`badge--${tone}`">{{ label }}</span>

</template>

<style scoped>

.badge {

  display: inline-block;

  padding: 0.15rem 0.6rem;

  border-radius: 999px;

  font-size: 0.78rem;

  font-weight: 600;

}

.badge--success { background: color-mix(in srgb, var(--color-success) 18%, transparent); color: var(--color-success); }

.badge--danger { background: color-mix(in srgb, var(--color-error) 18%, transparent); color: var(--color-error); }

.badge--warning { background: color-mix(in srgb, var(--color-warning) 30%, transparent); color: #7a5b00; }

.badge--neutral { background: var(--color-surface); color: var(--color-text-muted); border: 1px solid var(--color-border); }

</style>
