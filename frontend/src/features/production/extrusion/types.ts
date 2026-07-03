export const EXTRUSION_SHIFTS = ["mañana", "tarde", "noche"] as const

export type ExtrusionShift = (typeof EXTRUSION_SHIFTS)[number]

export const EXTRUSION_MICRON_COUNT = 7

/** Filas en la grilla opcional de micrajes (modo avanzado). */
export const EXTRUSION_MICRON_GRID_ROWS = 5

/** @deprecated Use EXTRUSION_MICRON_GRID_ROWS */
export const EXTRUSION_COIL_COUNT = EXTRUSION_MICRON_GRID_ROWS

/** Tope práctico para cantidad de bobinas en modo simple (campo libre). */
export const EXTRUSION_MAX_COILS_PER_SEGMENT = 99

export const EXTRUSION_MACHINE_LINES = ["1", "2", "3", "4", "5", "6", "7"] as const

export type ExtrusionMachineLine = (typeof EXTRUSION_MACHINE_LINES)[number]

export const EXTRUSION_FORMATS = ["refil", "transparente", "estandar"] as const

export type ExtrusionFormat = (typeof EXTRUSION_FORMATS)[number]

export type ExtrusionCoilInput = {
  microns: number[]
  kg: number
}

export type ExtrusionWasteInput = {
  waste_type: "refil" | "transparente"
  waste_kg: number
}

export type ExtrusionSegmentInput = {
  shift: ExtrusionShift
  operator_name?: string | null
  started_at?: string
  ended_at?: string
  effective_minutes: number
  machine?: string | null
  production_format?: ExtrusionFormat | string | null
  coils?: ExtrusionCoilInput[]
  produced_kg?: number | null
  coils_count?: number | null
  waste_lines?: ExtrusionWasteInput[]
  bolsones_kg?: number | null
  fallas_kg?: number | null
  core_kg?: number | null
}

export type ExtrusionCloseInput = {
  reassigned_work_order_id?: number | null
  last_segment?: ExtrusionSegmentInput | null
  complete_mixture?: boolean
  mark_work_completed?: boolean
  production_route?: "dispatch" | "sealing" | null
}

export type ExtrusionSegmentRead = {
  id: number
  shift: string
  operator_name?: string | null
  started_at?: string | null
  ended_at?: string | null
  effective_minutes: string
  production_format?: string | null
  machine?: string | null
  total_kg: string
  core_kg?: string | null
  recorded_at?: string | null
}

export type ExtrusionSessionRead = {
  id: number
  work_order_id: number
  reassigned_work_order_id?: number | null
  status: string
  total_kg: string
  total_effective_minutes?: string | null
  recorded_date?: string | null
  work_order_code?: string | null
  reassigned_work_order_code?: string | null
  production_work_order_id?: number | null
  production_work_order_code?: string | null
  target_kg?: string | null
}

export type ExtrusionActiveSession = {
  session: ExtrusionSessionRead
  segments: ExtrusionSegmentRead[]
}

export type ExtrusionRunResponse = {
  id: number
  total_kg: string | number
  total_effective_minutes?: string | null
  mixture_remaining_kg?: string | null
  mixture_run_id?: number | null
}

export type ExtrusionSessionCreateInput = {
  work_order_id: number
  target_kg?: number | string | null
  mixture_production_run_id?: number | null
}

export type ExtrusionRunListItem = {
  id: number
  work_order_id: number
  reassigned_work_order_id?: number | null
  shift: string
  recorded_at: string
  total_effective_minutes?: string | null
  started_at?: string | null
  ended_at?: string | null
  effective_minutes?: string | null
  machine?: string | null
  production_format?: string | null
  target_kg?: string | null
  total_kg: string
  status?: string
  work_order_code?: string | null
  reassigned_work_order_code?: string | null
  production_work_order_id?: number | null
  production_work_order_code?: string | null
  created_at?: string
}

export type ExtrusionDailySummary = {
  date: string
  shift?: string | null
  machine?: string | null
  total_kg: string
  total_bolsones_kg: string
  total_core_kg: string
  total_waste_kg: string
  coils_count: number
  runs_count: number
}

export type ExtrusionRunListQuery = {
  page?: number
  per_page?: number
  work_order_id?: number
  include_reassigned?: boolean
  on_date?: string
  shift?: string
  machine?: string
}

export type TimerState = "idle" | "running" | "paused"
