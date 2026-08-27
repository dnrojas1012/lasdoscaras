<script setup lang="ts">
defineProps<{
    likes: number
    dislikes: number
// Que reacciono el usuario en ESTE lado. null si no reacciono.
myReaction: 'LIKE' | 'DISLIKE' | null

// Se deshabilita mientras hay una peticion en curso,
// para evitar el doble envio que prohibe el enunciado.
disabled?: boolean
    
// Sin sesion no se puede reaccionar.
canReact: boolean
}>()

const emit = defineEmits<{ (e: 'react', tipo: 'like' | 'dislike'): void }>()
</script>
<template>
<div class="reactions">
    <button
    class="react react--like"
    :class="{ 'react--active': myReaction === 'LIKE' }"
    :disabled="disabled || !canReact"
    :aria-pressed="myReaction === 'LIKE'"
    :title="canReact ? 'Me gusta esta postura' : 'Inicie sesión para reaccionar'"
    @click="emit('react', 'like')"
    >
    <span aria-hidden="true">👍</span>
    <span class="react__count">{{ likes }}</span>
    <span class="sr-only">me gusta</span>
</button>

<button
class="react react--dislike"
:class="{ 'react--active': myReaction === 'DISLIKE' }"
:disabled="disabled || !canReact"
:aria-pressed="myReaction === 'DISLIKE'"
:title="canReact ? 'No me gusta esta postura' : 'Inicie sesión para reaccionar'"
@click="emit('react', 'dislike')"
>
<span aria-hidden="true">👎</span>
<span class="react__count">{{ dislikes }}</span>
<span class="sr-only">no me gusta</span>
</button>
</div>
</template>

<style scoped>
.reactions { display: flex; gap: 0.6rem; }
.react {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.15s ease;
}

.react:disabled { opacity: 0.5; cursor: not-allowed; }
.react__count { font-weight: 600; }


/* El estado activo se destaca visualmente */
.react--like.react--active {
    background: var(--color-success);
    border-color: var(--color-success);
    color: #fff;
}
    
.react--dislike.react--active {
    background: var(--color-error);
    border-color: var(--color-error);
    color: #fff;
}

.sr-only {
    position: absolute; width: 1px; height: 1px;
    padding: 0; margin: -1px; overflow: hidden;
    clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>