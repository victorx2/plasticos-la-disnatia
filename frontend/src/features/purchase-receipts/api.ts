import { getJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  DuplicateReceiptCheck,
  PurchaseReceipt,
  PurchaseReceiptInput,
  PurchaseReceiptListQuery,
} from "@/features/purchase-receipts/types"

export async function fetchPurchaseReceipts(
  query: PurchaseReceiptListQuery = {},
): Promise<PaginatedResponse<PurchaseReceipt>> {
  return getJson<PaginatedResponse<PurchaseReceipt>>("purchase-receipts", {
    page: query.page,
    per_page: query.per_page,
    purchase_order_id: query.purchase_order_id,
    supplier_name: query.supplier_name,
    invoice_number: query.invoice_number,
    material_term: query.material_term,
    from: query.from,
    to: query.to,
  })
}

export async function fetchPurchaseReceipt(id: number): Promise<PurchaseReceipt> {
  return getJson<PurchaseReceipt>(`purchase-receipts/${id}`)
}

export async function createPurchaseReceipt(
  input: PurchaseReceiptInput,
): Promise<PurchaseReceipt> {
  return postJson<PurchaseReceipt>("purchase-receipts", input)
}

export async function checkDuplicateReceipts(query: {
  supplier_id: number
  invoice_number?: string
  purchase_order_reference?: string
}): Promise<DuplicateReceiptCheck> {
  return getJson<DuplicateReceiptCheck>("purchase-receipts/check-duplicates", {
    supplier_id: query.supplier_id,
    invoice_number: query.invoice_number,
    purchase_order_reference: query.purchase_order_reference,
  })
}
