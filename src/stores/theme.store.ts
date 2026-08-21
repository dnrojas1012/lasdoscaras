import { defineStore } from 'pinia'
import { ref } from 'vue'
import { cacheService, CACHE_KEYS } from '../services/cacheService'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
    const current = ref<Theme>(
        (document.documentElement.getAttribute('data-theme') as Theme) ?? 'light',
    )

function apply(theme: Theme): void {
    current.value = theme
    document.documentElement.setAttribute('data-theme', theme)
    cacheService.set<Theme>(CACHE_KEYS.theme, theme)
}

function toggle(): void {
    apply(current.value === 'dark' ? 'light' : 'dark')
}

return { current, apply, toggle }
})