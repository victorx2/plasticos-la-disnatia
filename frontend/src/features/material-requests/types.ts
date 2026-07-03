import type { Material } from "@/features/materials/types"

export type MaterialRequestLine = {
  id?: number
  material_id?: number | null
  description?: string | null
  quantity_requested: string | number
  quantity_dispatched?: string | number
  unit?: string | null
  material?: Pick<Material, "id" | "sku" | "name" | "unit"> | null
}

export type MaterialRequest = {
  id: number
  status: string
  originating_area?: string | null
  destination_areas?: string[] | null
  notes?: string | null
  document_date?: string | null
  authorized_by?: number | null
  work_order_id?: number | null
  work_order?: { id: number; code?: string } | null
  /** Kg autorizados al crear la solicitud (cupo inicial). */
  kg_authorized?: string | number | null
  kg_dispatched?: string | number | null
  kg_remaining?: string | number | null
  rejection_reason?: string | null
  counter_proposal_lines?: MaterialRequestLine[]
  request_flow?: "outbound" | "inbound" | string | null
  lines?: MaterialRequestLine[]
  requester?: { id: number; name: string } | null
  created_at?: string
  /** Mezcla creada automáticamente al despachar (solo en respuesta de dispatch). */
  generated_mixture_id?: number | null
  /** Kg restantes en mezcla principal tras crear/despachar (si aplica). */
  principal_kg_remaining?: string | null
  is_replenishment?: boolean
}

export type MaterialRequestDetail = MaterialRequest

export type MaterialRequestLineInput = {
  material_id?: number | null
  description?: string | null
  quantity_requested: string | number
  unit?: string | null
}

export type MaterialRequestInput = {
  originating_area?: string | null
  destination_areas?: string[]
  notes?: string | null
  document_date?: string | null
  work_order_id?: number | null
  /** Permite pedir insumos extra cuando el cupo de mezcla principal está agotado. */
  allow_replenishment?: boolean
  lines: MaterialRequestLineInput[]
}

export type MaterialRequestDispatchLineInput = {
  material_request_line_id: number
  quantity: string | number
  material_id?: number | null
}

export type MaterialRequestDispatchInput = {
  lines: MaterialRequestDispatchLineInput[]
}

export type MaterialRequestRejectInput = {
  reason: string
  counter_lines?: MaterialRequestLineInput[]
}
