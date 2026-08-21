/**
 * Hashtag asociado a una publicación.
 *
 * NOTA: el API entregado por el profesor no expone todavía un endpoint
 * de hashtags. Esta interfaz define la forma esperada para que la capa
 * de servicios quede tipada; mientras el endpoint no exista, los
 * hashtags se derivan en el cliente a partir de las publicaciones ya
 * traídas. Cuando el endpoint se habilite, solo cambia hashtags.api.ts.
 */
export interface Hashtag {
  id: string
  name: string
  // Cantidad de publicaciones que lo usan. Opcional porque no todas
  // las respuestas lo incluyen.
  count?: number
}