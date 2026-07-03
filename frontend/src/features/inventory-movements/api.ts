import { getJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  InventoryMovement,
  InventoryMovementListQuery,
} from "@/features/inventory-movements/types"

export async function fetchInventoryMovements(
  query: InventoryMovementListQuery = {},
): Promise<PaginatedResponse<InventoryMovement>> {
  return getJson<PaginatedResponse<InventoryMovement>>("inventory-movements", {
    page: query.page,
    per_page: query.per_page,
    from: query.from,
    to: query.to,
    movement_type: query.movement_type,
    inventory_area: query.inventory_area,
    reference_type: query.reference_type,
    search: query.search ?? query.q,
  })
}
