import type { Client } from "@/features/masters/clients/types"
import type { Product } from "@/features/masters/products/types"

export type NrocOrderStatus = "open" | "fulfilled" | "cancelled"

export type NrocOrderLine = {
  id?: number
  product_id?: number | null
  material_id?: number | null
  quantity: string
  unit?: string | null
  description?: string | null
  notes?: string | null
  product?: Pick<Product, "id" | "name" | "cpe" | "mps"> | null
}

export type NrocOrder = {
  id: number
  batch_id?: number | null
  batch_code?: string | null
  client_id: number
  code: string
  status: NrocOrderStatus | string
  notes: string | null
  ordered_at?: string | null
  /** VENTA Para — destino o referencia comercial de la orden. */
  sale_for?: string | null
  client?: Pick<Client, "id" | "name" | "rif" | "address"> | null
  lines_count?: number
  active_works_count?: number
  first_line_with_product?: {
    id: number
    product_id: number
    quantity?: string
    unit?: string
    product?: Pick<Product, "id" | "name" | "cpe" | "mps"> | null
  } | null
  lines?: NrocOrderLine[]
}

export type NrocOrderListQuery = {
  q?: string
  page?: number
  per_page?: number
  client_id?: number
  status?: string
  batch_id?: number
  awaiting_schedule?: boolean
  sort?: "asc" | "desc"
}

export type NrocOrderLineInput = {
  product_id?: number
  material_id?: number
  description?: string
  quantity: number
  unit?: string
  notes?: string
}

export type NrocOrderInput = {
  client_id: number
  batch_id?: number
  code?: string
  status?: string
  ordered_at?: string
  sale_for?: string | null
  notes?: string
  lines?: NrocOrderLineInput[]
}

export type NrocOrderViewTab = "all" | "awaiting_schedule" | "open" | "fulfilled"

/** Raw API shape for `client-orders` (field names unchanged on wire). */
export type ApiNrocOrder = Omit<NrocOrder, "active_works_count"> & {
  active_work_orders_count?: number
}

export type ApiNrocOrderListQuery = {
  q?: string
  page?: number
  per_page?: number
  client_id?: number
  status?: string
  batch_id?: number
  awaiting_ot?: boolean
  sort?: "asc" | "desc"
}

export type ProductionBatch = {
  id: number
  code: string
  notes?: string | null
  created_at?: string | null
  orders?: NrocOrder[]
}

export type ProductionBatchInput = {
  client_id: number
  code?: string
  notes?: string | null
  ordered_at?: string
  sale_for?: string | null
  order_notes?: string | null
  lines?: NrocOrderLineInput[]
}

export type NrocOrderHistory = {
  order: {
    id: number
    code: string
    status: string
    client_name?: string | null
    ordered_at?: string | null
    lines: Array<{ product_name?: string | null; quantity: string; unit?: string | null }>
  }
  work_orders: Array<{
    id: number
    code: string
    status: string
    board_stage: string
    quantity_kg: string
    created_at?: string | null
  }>
  material_requests: Array<{
    id: number
    work_order_id?: number | null
    flow: string
    status: string
    kg_authorized: string
    kg_dispatched: string
    kg_remaining: string
    created_at?: string | null
    lines: Array<{
      description?: string | null
      quantity_requested: string
      quantity_dispatched: string
      unit?: string | null
    }>
  }>
  extrusion_runs: Array<{
    id: number
    work_order_id: number
    status: string
    total_kg: string
    coils_count: number
    coils_kg_total: string
    started_at?: string | null
    ended_at?: string | null
    segments: Array<{
      shift?: string | null
      machine?: string | null
      total_kg: string
      bolsones_kg: string
      coils_count: number
      started_at?: string | null
      ended_at?: string | null
    }>
  }>
  dispatch_summary: {
    coils_dispatched: number
    coils_pending: number
  }
  timeline: {
    started_at?: string | null
    completed_at?: string | null
    duration_hours?: string | null
  }
}
