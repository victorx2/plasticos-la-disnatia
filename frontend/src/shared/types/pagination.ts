/** Respuesta paginada estándar del API Python (compatible con listados actuales). */
export type PaginatedResponse<T> = {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}
