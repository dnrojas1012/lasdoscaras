export interface Category {
    id: string
    name: string
    // El signo de interrogación indica que el campo puede no venir.
    // // TypeScript entonces obliga a comprobar antes de usarlo.
    description?: string
}