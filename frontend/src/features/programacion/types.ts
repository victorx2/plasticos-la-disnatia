import type { Client } from "@/features/masters/clients/types"
import type { Product } from "@/features/masters/products/types"

export const BOARD_STAGES = [
  "nueva",
  "pendiente",
  "mezcla",
  "extrusion",
  "completada",
] as const

export type BoardStage = (typeof BOARD_STAGES)[number]

export type ProductionOrderRow = {
  id: number
  code: string
  document_date?: string | null
  created_at?: string | null
  status: string
  board_stage?: string
  scheduling_status?: string
  client?: Pick<Client, "id" | "name">
  product?: Pick<Product, "id" | "name">
  /** Cantidad pedida en la línea de orden vinculada al trabajo. */
  order_quantity?: string | null
  order_unit?: string | null
  /** Orden de producción (cliente) vinculada — API: `client_order`. */
  production_order?: { id: number; code?: string; batch_code?: string | null }
}

export type PendingProductionLine = {
  line_id: number
  client_order_id: number
  order_code: string
  line_seq: number
  quantity: string
  unit: string | null
  client?: Pick<Client, "id" | "name"> | null
  product?: Pick<Product, "id" | "name"> | null
}

/** @deprecated Use PendingProductionLine */
export type PendingProductionOrder = {
  id: number
  client_id: number
  code: string
  status: string
  notes: string | null
  client?: Pick<Client, "id" | "name"> | null
  lines_count?: number
  first_line_with_product?: {
    product?: Pick<Product, "id" | "name"> | null
    quantity?: string
    unit?: string
  } | null
}

export type ProgramacionBoard = {
  columns: Record<string, ProductionOrderRow[]>
  pending_lines?: PendingProductionLine[]
  active_extrusion_work_order_ids?: number[]
}

/** Raw API shape for `work-orders/programacion-board`. */
export type ApiProgramacionBoardResponse = {
  columns: Record<string, ApiProductionOrderRow[]>
  pending_lines?: PendingProductionLine[]
}

export type ApiProductionOrderRow = Omit<ProductionOrderRow, "production_order"> & {
  client_order?: { id: number; code?: string; batch_code?: string | null }
}

export type CreateProductionOrderInput = {
  production_order_id: number
  client_order_line_id?: number
  import_production_lines?: boolean
  auto_create_material_request?: boolean
  board_stage?: string
}

export type UpdateProductionOrderStageInput = {
  board_stage: string
}

/** @deprecated Use ProductionOrderRow */
export type WorkOrderListRow = ProductionOrderRow

/** @deprecated Use PendingProductionOrder */
export type PendingNrocOrder = PendingProductionOrder

/** @deprecated Use ProgramacionBoard */
export type ProgramacionBoardResponse = ProgramacionBoard

/** @deprecated Use CreateProductionOrderInput */
export type CreateWorkOrderFromClientOrderInput = CreateProductionOrderInput

/** @deprecated Use UpdateProductionOrderStageInput */
export type UpdateWorkOrderStageInput = UpdateProductionOrderStageInput

/** @deprecated Use production_order */
export type { ProductionOrderRow as NrocOrderLink }
