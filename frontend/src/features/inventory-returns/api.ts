import { getJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  InventoryReturn,
  InventoryReturnBatchInput,
  InventoryReturnInput,
  InventoryReturnListQuery,
  ReturnableProduct,
} from "@/features/inventory-returns/types"

export async function fetchInventoryReturns(
  query: InventoryReturnListQuery = {},
): Promise<PaginatedResponse<InventoryReturn>> {
  return getJson<PaginatedResponse<InventoryReturn>>("inventory-returns", {
    page: query.page,
    per_page: query.per_page,
    status: query.status,
    destination_area: query.destination_area,
    destination_areas: query.destination_areas,
  })
}

export async function fetchReturnableProducts(workOrderId: number): Promise<ReturnableProduct[]> {
  return getJson<ReturnableProduct[]>("inventory-returns/returnable-products", {
    work_order_id: workOrderId,
  })
}

export async function createInventoryReturn(
  input: InventoryReturnInput,
): Promise<InventoryReturn> {
  return postJson<InventoryReturn>("inventory-returns", input)
}

export async function createInventoryReturnsBatch(
  input: InventoryReturnBatchInput,
): Promise<InventoryReturn[]> {
  return postJson<InventoryReturn[]>("inventory-returns/batch", input)
}

export async function acceptInventoryReturn(
  id: number,
  reason: string,
): Promise<InventoryReturn> {
  return postJson<InventoryReturn>(`inventory-returns/${id}/accept`, { reason })
}

export async function releaseInventoryReturnToMaterials(
  id: number,
  reason?: string,
): Promise<InventoryReturn> {
  return postJson<InventoryReturn>(`inventory-returns/${id}/release-to-materials`, {
    reason: reason ?? null,
  })
}
