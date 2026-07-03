import type { Supplier } from "@/features/masters/suppliers/types"
import type { Material } from "@/features/materials/types"

export type PurchaseOrder = {
  id: number
  supplier_id: number
  code: string
  status: string
  ordered_at: string | null
  created_at?: string | null
  notes: string | null
  tax_applies?: boolean
  is_active?: boolean
  supplier?: Pick<Supplier, "id" | "name">
  lines?: PurchaseOrderLine[]
  lines_count?: number
  receipts_count?: number
  last_receipt_at?: string | null
  receipt_progress_label?: string | null
}

export type PurchaseOrderLine = {
  id?: number
  description?: string | null
  material_id?: number | null
  quantity_ordered: string | number
  quantity_received?: string | number
  unit?: string | null
  unit_price?: string | number | null
  material?: Pick<Material, "id" | "sku" | "name" | "unit"> | null
}

export type PurchaseOrderLineInput = {
  id?: number
  description?: string | null
  material_id?: number | null
  quantity_ordered: string | number
  unit?: string | null
  unit_price?: string | number | null
}

export type PurchaseOrderInput = {
  supplier_id: number
  code: string
  ordered_at?: string | null
  notes?: string | null
  tax_applies?: boolean
  lines: PurchaseOrderLineInput[]
  change_reason?: string | null
}

export type PurchaseOrderListQuery = {
  q?: string
  page?: number
  per_page?: number
  supplier_id?: number
  status?: string
  has_receipts?: boolean
  visibility?: "active" | "all" | "inactive"
}

export type PurchaseOrderViewTab = "pending" | "history"
