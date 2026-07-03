export type MixtureProductionRun = {
  id: number
  tinta_mixture_id: number
  work_order_id: number
  status: string
  fully_used?: boolean | null
  remaining_kg?: string | null
  reason?: string | null
  used_in_work_order_id?: number | null
  produced_kg?: string | null
  extrusion_run_id?: number | null
  inbound_material_request_id?: number | null
  mixture_output_name?: string | null
  mixture_output_sku?: string | null
  work_order_code?: string | null
  used_in_work_order_code?: string | null
  started_at?: string
  completed_at?: string | null
}

export type MixtureProductionHistoryEntry = MixtureProductionRun & {
  history_role: "origen" | "destino_cruzado" | "relacionado"
}

export type MixtureProductionRunInput = {
  tinta_mixture_id: number
  work_order_id: number
}

export type MixtureProductionCompleteInput = {
  fully_used: boolean
  remaining_kg?: string | number | null
  reason?: string | null
  used_in_work_order_id?: number | null
}

export type MixtureReturnToWarehouseInput = {
  kg: string | number
  notes?: string | null
}

export type MixtureReturnToWarehouseResult = {
  material_request_id: number
  kg: string
  kg_remaining: string
}

export type MixtureProductionListQuery = {
  page?: number
  per_page?: number
  work_order_id?: number
  status?: string
}

export type MixtureBeginExtrusionResult = {
  mixture_run: MixtureProductionRun
  mixture_initial_kg: string
  mixture_available_kg: string
  mixture_dispatched_kg: string
  extrusion_session_id: number
  work_order_id: number
}

export type MixtureProductionCompleteResult = MixtureProductionRun
