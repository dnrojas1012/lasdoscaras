<template>
<!-- aria-hidden: es un relleno visual mientras carga, no contenido real. 
Sin esto, un lector de pantalla anunciaria cajas vacias sin sentido. -->
  <div class="skeleton" aria-hidden="true">
    <div class="skeleton__line skeleton__line--title"></div>
    <div class="skeleton__line"></div>
    <div class="skeleton__line skeleton__line--short"></div>
  </div>
</template>

<style scoped>

.skeleton {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.skeleton__line {
  height: 0.8rem;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--color-border) 25%, var(--color-surface) 50%, var(--color-border) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton__line--title { height: 1.2rem; width: 70%; }

.skeleton__line--short { width: 45%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

</style>