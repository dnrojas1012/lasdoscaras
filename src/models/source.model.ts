// Los tres tipos de fuente que acepta el API.
// Al escribirlo como unión de textos literales, TypeScript solo permite
// exactamente esos tres valores. Si alguien escribe 'VIDEO' por error,
// el editor lo marca antes de ejecutar.
export type SourceType = 'LINK' | 'YOUTUBE' | 'DOCUMENT'

export interface Source {
    id: string
    type: SourceType
    url: string
    label?: string
}