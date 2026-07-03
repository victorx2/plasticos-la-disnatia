export type AreaRequest = {
  id: number
  area: string
  title: string | null
  body?: string | null
  status: string
  material_request_id: number
  /** Trabajo en planta vinculado (`work_order_id` en API). */
  work_order_id?: number | null
  requester?: { id: number; name: string } | null
  created_at?: string
  // 🌟 Agrega esta línea para que TypeScript sepa que existe:
  production_order_number?: string | null;
}

export type AreaRequestListQuery = {
  page?: number
  per_page?: number
  area?: string
  status?: string
  insumos_only?: boolean
  insumos_origin?: "manual" | "ot_planilla"
}

export type WarehousePendingCount = {
  count: number
  manual_pending: number
  ot_planilla_pending: number
}
