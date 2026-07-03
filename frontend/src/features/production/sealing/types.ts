export const SEALING_SHIFTS = ["mañana", "tarde", "noche"] as const

export type SealingShift = (typeof SEALING_SHIFTS)[number]

export type SealingBobinaLineInput = {
  extrusion_coil_id?: number | null
  coil_code?: string | null
  measure?: string | null
  units: number
  production_kg?: number | null
  waste_kg?: number | null
}

export type SealingRunInput = {
  work_order_id: number
  shift: SealingShift
  recorded_at?: string
  started_at?: string
  ended_at?: string
  effective_minutes?: number
  waste_kg?: number
  notes?: string | null
  bobina_lines: SealingBobinaLineInput[]
}

export type SealingBobinaLineRead = {
  id: number
  extrusion_coil_id?: number | null
  coil_code?: string | null
  measure?: string | null
  units: string
  production_kg?: string | null
  waste_kg?: string | null
}

export type SealingExtrusionCoilRead = {
  id: number
  coil_code: string
  production_kg: string
  measure?: string | null
}

export type SealingRunRead = {
  id: number
  work_order_id: number
  work_order_code?: string | null
  shift: string
  recorded_at: string
  total_units: string
  waste_kg: string
  notes?: string | null
  status: string
  bobina_lines: SealingBobinaLineRead[]
  created_at: string
}

export type PaginatedSealingRuns = {
  data: SealingRunRead[]
  current_page: number
  last_page: number
}
