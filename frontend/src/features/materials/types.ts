import type { MaterialCategoryTab, MaterialCategoryValue } from "@/features/materials/domain/categories"
import type { Supplier } from "@/features/masters/suppliers/types"

export type { MaterialCategoryValue, MaterialCategoryTab }

/** @deprecated Legacy areas — kept for inventory-movements / returns compatibility */
export type InventoryAreaValue =
  | "material"
  | "tintas"
  | "cementerio_tintas"
  | "quimicos"
  | "bobinas_rechazadas"
  | "fallas"
  | "miscelaneos"

export type TintaSubareaValue =
  | "laminacion"
  | "superficie"
  | "prueba_laminacion"
  | "laminacion_nueva"

export type Material = {
  id: number
  sku: string
  name: string
  barcode?: string | null
  inventory_area: MaterialCategoryValue | InventoryAreaValue | string
  product_type?: string | null
  brand?: string | null
  units_count?: string | number | null
  container_number?: string | null
  micras?: string | null
  ancho?: string | null
  unit: string
  quantity_on_hand: string
  min_stock: string
  notes?: string | null
  supplier_id?: number | null
  no_supplier_reason?: string | null
  supplier?: Pick<Supplier, "id" | "name"> | null
  tinta_subareas?: Array<{ id: number; subarea: string }>
  created_at?: string
  updated_at?: string
}

export type MaterialInput = {
  sku: string
  name: string
  barcode?: string | null
  inventory_area: string
  product_type?: string | null
  brand?: string | null
  units_count?: string | number | null
  container_number?: string | null
  tinta_subarea?: string | null
  micras?: string | number | null
  ancho?: string | number | null
  unit?: string | null
  min_stock?: string | number | null
  quantity_on_hand?: string | number | null
  notes?: string | null
  supplier_id?: number | null
  no_supplier_reason?: string | null
  change_reason?: string | null
}

export type MaterialListQuery = {
  q?: string
  page?: number
  per_page?: number
  inventory_area?: string
  stock_state?: "sin_stock" | "bajo_minimo" | "ok"
}

export type MaterialImportRowError = {
  row: number
  message: string
}

export type MaterialImportResult = {
  batch_id: number | null
  filename: string
  created: number
  updated: number
  skipped: number
  errors: MaterialImportRowError[]
}
