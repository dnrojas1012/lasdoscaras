export const CACHE_KEYS = {
    auth: 'lasdoscaras_auth',
    categories: 'lasdoscaras_categories',
    hashtags: 'lasdoscaras_hashtags',
    filters: 'lasdoscaras_filters',
    favorites: 'lasdoscaras_favorites',
    draft: 'lasdoscaras_draft',
    theme: 'lasdoscaras_theme',
    history: 'lasdoscaras_history',
} as const

// Extrae automáticamente el tipo "cualquiera de los valores de CACHE_KEYS".
// Si mañana se agrega una clave nueva, este tipo se actualiza solo.
export type CacheKey = (typeof CACHE_KEYS)[keyof typeof CACHE_KEYS]


export const TTL = {
    categories: 60 * 60 * 1000,
    hashtags: 30 * 60 * 1000,
    permanent: null,
} as const

interface CacheEntry<T> {
    value: T
    timestamp: number
}

// Lee la entrada y la convierte de texto a objeto.
// localStorage solo guarda texto
function readEntry<T>(key: CacheKey): CacheEntry<T> | null {
    try {
        const raw = localStorage.getItem(key)
        if (raw === null) return null
        return JSON.parse(raw) as CacheEntry<T>
    } catch {
        localStorage.removeItem(key)
        return null
    }
}

// Guarda un valor junto con la hora actual.
function set<T>(key: CacheKey, value: T): void {
    try {
        const entry: CacheEntry<T> = { value, timestamp: Date.now() }
        localStorage.setItem(key, JSON.stringify(entry))
    } catch (error) {
        console.error(`No se pudo guardar en caché la clave ${key}:`, error)
    }
    }

// Lee un valor respetando su vencimiento.
function get<T>(key: CacheKey, ttl: number | null = null): T | null {
    const entry = readEntry<T>(key)
    if (entry === null) return null

    if (ttl !== null) {
        const edad = Date.now() - entry.timestamp
        if (edad > ttl) return null   // venció
}
return entry.value
}

// Lee un valor SIN importar si venció.
function getStale<T>(key: CacheKey): T | null {
    const entry = readEntry<T>(key)
    return entry === null ? null : entry.value
}

// Indica si un dato existe pero ya venció.
function isStale(key: CacheKey, ttl: number | null): boolean {
    const entry = readEntry<unknown>(key)
    if (entry === null) return false
    if (ttl === null) return false
    return Date.now() - entry.timestamp > ttl
}

function remove(key: CacheKey): void {
    localStorage.removeItem(key)
}

// Borra solo lo nuestro
function clearAll(): void {
    Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key))
}

export const cacheService = {
    set,
    get,
    getStale,
    isStale,
    remove,
    clearAll,
}