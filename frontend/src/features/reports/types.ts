export type ProductionTimeRow = {
  work_order_id: number
  work_order_code: string
  client_name?: string | null
  effective_minutes?: string
  segment_count?: number
  effective_hours?: string | null
  dead_hours?: string | null
  utilization_pct?: string | null
}

export type MixtureMaterialRow = {
  material_sku: string
  material_name: string
  total_kg: string
}

export type MixtureConsumptionRow = {
  output_sku: string
  output_name: string
  total_kg: string
  components?: MixtureMaterialRow[]
}

export type ClientOrderLineReportRow = {
  line_id?: number | null
  work_order_id?: number | null
  work_order_code?: string | null
  product_name?: string | null
  quantity: string
  unit?: string | null
  target_kg?: string | null
}

export type MixtureConsumptionByOrderRow = {
  client_order_code: string
  client_name?: string | null
  product_name?: string | null
  order_target_kg?: string | null
  kg_remaining?: string | null
  total_produced_kg: string
  produced_kg_pending_close?: string
  total_mixture_used_kg?: string
  mixture_received_cross_kg?: string
  mixture_sent_cross_kg?: string
  mixture_totals: MixtureConsumptionRow[]
  mixture_recipe?: MixtureMaterialRow[]
  order_lines?: ClientOrderLineReportRow[]
}

export type ProductionGeneralRow = {
  work_order_id: number
  work_order_code: string
  client_order_code?: string | null
  client_name?: string | null
  total_coils: number
  total_kg: string
  total_bolsones_kg: string
}

export type WasteByOrderRow = {
  client_order_code?: string | null
  work_order_code: string
  refil_kg: string
  transparente_kg: string
  total_kg: string
}

export type WasteConsolidatedRow = {
  refil_kg: string
  transparente_kg: string
  total_kg: string
}

export type ReportsQuery = {
  from_date?: string
  to_date?: string
  order_id?: number
}

export type ProductionMachineOrderRow = {
  work_order_id: number
  work_order_code: string
  client_order_code?: string | null
  total_kg: string
  coils_count: number
  bolsones_kg: string
}

export type ProductionMachineShiftRow = {
  shift?: string | null
  total_kg: string
  coils_count: number
  bolsones_kg: string
  orders: ProductionMachineOrderRow[]
}

export type ProductionMachineReportRow = {
  machine?: string | null
  total_kg: string
  coils_count: number
  bolsones_kg: string
  shifts: ProductionMachineShiftRow[]
}
