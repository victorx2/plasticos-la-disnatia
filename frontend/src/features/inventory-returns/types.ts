import type { Material } from "@/features/materials/types"

export type InventoryReturn = {
  id: number
  material_id?: number | null
  work_order_id?: number | null
  extrusion_run_id?: number | null
  extrusion_coil_id?: number | null
  product_type?: string | null
  shift?: string | null
  quantity_units?: number | null
  destination_area: string
  quantity: string | number
  status: string
  reason?: string | null
  material?: Pick<Material, "id" | "sku" | "name"> & {
    supplier?: { id: number; name: string } | null
  }
  work_order?: { id: number; code: string; client_order_code?: string | null } | null
  product_label?: string | null
  coil_code?: string | null
  sent_to_materials?: boolean
  created_at?: string
}

export type ReturnableProduct = {
  key: string
  product_type: string
  label: string
  extrusion_coil_id?: number | null
  extrusion_run_id?: number | null
  shift?: string | null
  kg_per_unit: string
  kg_available: string
  max_units: number
  measure?: string | null
  product_name?: string | null
}

export type InventoryReturnLineInput = {
  product_key: string
  quantity_units: number
}

export type InventoryReturnBatchInput = {
  work_order_id: number
  reason?: string | null
  return_route?: "fallas" | "rejected" | "tintas"
  lines: InventoryReturnLineInput[]
}

export type InventoryReturnListQuery = {
  page?: number
  per_page?: number
  status?: string
  destination_area?: string
  destination_areas?: string
}

export type InventoryReturnInput = {
  material_id?: number | null
  work_order_id?: number | null
  extrusion_run_id?: number | null
  extrusion_coil_id?: number | null
  product_type?: string | null
  shift?: string | null
  quantity_units?: number | null
  destination_area: string
  quantity: string | number
  reason?: string | null
}

export type ReturnKindTab = "all" | "good" | "rejected" | "tintas" | "fallas"
