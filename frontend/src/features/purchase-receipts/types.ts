import type { Supplier } from "@/features/masters/suppliers/types"
import type { Material } from "@/features/materials/types"
import type { PurchaseOrder } from "@/features/purchase-orders/types"

export type ReceiptItemTypeApi = "sustrato" | "miscelaneo" | "consumible" | "tinta" | "quimico"

export type PurchaseReceiptLine = {
  id?: number
  material_id: number
  item_type: ReceiptItemTypeApi | string
  quantity: string | number
  unit: string
  micras?: string | number | null
  ancho_mm?: string | number | null
  purchase_order_line_id?: number | null
  material?: Pick<Material, "id" | "sku" | "name"> | null
}

export type PurchaseReceipt = {
  id: number
  purchase_order_id?: number | null
  without_purchase_order?: boolean
  supplier_id: number
  supplier_name?: string | null
  invoice_number?: string | null
  purchase_order_reference?: string | null
  notes?: string | null
  received_at: string | null
  lines_count?: number
  lines?: PurchaseReceiptLine[]
  supplier?: Pick<Supplier, "id" | "name" | "rif"> | null
  purchase_order?: Pick<PurchaseOrder, "id" | "code"> | null
  user?: { id: number; name: string } | null
}

export type PurchaseReceiptListQuery = {
  q?: string
  page?: number
  per_page?: number
  purchase_order_id?: number
  supplier_name?: string
  invoice_number?: string
  material_term?: string
  from?: string
  to?: string
}

export type PurchaseReceiptLineInput = {
  purchase_order_line_id: number
  material_id: number
  item_type: ReceiptItemTypeApi
  quantity: string | number
  unit: string
  micras?: string | number | null
  ancho_mm?: string | number | null
}

export type PurchaseReceiptInput = {
  purchase_order_id: number
  without_purchase_order: false
  supplier_id: number
  supplier_name?: string | null
  invoice_number?: string | null
  purchase_order_reference?: string | null
  notes?: string | null
  received_at?: string | null
  lines: PurchaseReceiptLineInput[]
}

export type PurchaseReceiptViewTab = "pending" | "history"

export type DuplicateReceiptCheck = {
  has_duplicates: boolean
  total_matches: number
  matches: Array<{
    id: number
    supplier_id: number
    supplier_name?: string | null
    invoice_number?: string | null
    purchase_order_reference?: string | null
    received_at?: string | null
  }>
}
