import { ref, watch, type Ref } from 'vue'

// Retrasa la propagacion de un valor hasta que pasen X milisegundos
// sin cambios. Sirve para no llamar al API en cada tecla que se escribe.

export function useDebounce<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref<T>(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null
  watch(source, (value) => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })
  return debounced
}
