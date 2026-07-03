import { getJson, patchJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  PurchaseOrder,
  PurchaseOrderInput,
  PurchaseOrderListQuery,
} from "@/features/purchase-orders/types"

export async function fetchNextPoCode(): Promise<string> {
  const res = await getJson<{ code: string }>("purchase-orders/next-code")
  return res.code
}

export async function fetchPurchaseOrders(
  query: PurchaseOrderListQuery = {},
): Promise<PaginatedResponse<PurchaseOrder>> {
  return getJson<PaginatedResponse<PurchaseOrder>>("purchase-orders", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    supplier_id: query.supplier_id,
    status: query.status,
    has_receipts: query.has_receipts === undefined ? undefined : query.has_receipts ? 1 : 0,
    visibility: query.visibility ?? "active",
  })
}

export async function fetchPurchaseOrder(id: number): Promise<PurchaseOrder> {
  return getJson<PurchaseOrder>(`purchase-orders/${id}`)
}

export async function createPurchaseOrder(input: PurchaseOrderInput): Promise<PurchaseOrder> {
  return postJson<PurchaseOrder>("purchase-orders", input)
}

export async function updatePurchaseOrder(
  id: number,
  input: Partial<PurchaseOrderInput>,
): Promise<PurchaseOrder> {
  return patchJson<PurchaseOrder>(`purchase-orders/${id}`, input)
}
