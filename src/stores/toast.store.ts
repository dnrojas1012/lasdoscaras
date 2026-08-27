import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

// Máximo de avisos en pantalla a la vez.
const MAX_TOASTS = 4

export const useToastStore = defineStore('toast', () => {
  // ref() crea un dato reactivo: cuando cambia, todo lo que lo muestra
  // en pantalla se vuelve a dibujar automáticamente.

  const toasts = ref<Toast[]>([])
  // Contador para dar un identificador único a cada aviso.
  // No usa ref porque no se muestra en pantalla.
  let nextId = 0

  function show(type: ToastType, message: string): void {
    const id = nextId++
    toasts.value.push({ id, type, message })
    // Si se pasa del máximo, se descarta el más antiguo.
    
    // shift() saca el primer elemento del arreglo.
    if (toasts.value.length > MAX_TOASTS) {
      toasts.value.shift()
    }

    // El enunciado pide mínimo 4 segundos para errores
    // y entre 2 y 3 segundos para los mensajes de éxito.
    const duracion = type === 'error' || type === 'warning' ? 5000 : 3000
    setTimeout(() => dismiss(id), duracion)
  }

  function dismiss(id: number): void {
    // filter() devuelve un arreglo nuevo sin el elemento indicado.
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  // Lo que se devuelve acá es lo que queda disponible para el resto
  // de la aplicación. show() queda privada a propósito: desde afuera
  // se usan los cuatro atajos.
  return {
    toasts,
    dismiss,
    success: (m: string) => show('success', m),
    error: (m: string) => show('error', m),
    warning: (m: string) => show('warning', m),
    info: (m: string) => show('info', m),
  }
})
