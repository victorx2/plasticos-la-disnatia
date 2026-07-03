import { getJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  AreaRequest,
  AreaRequestListQuery,
  WarehousePendingCount,
} from "@/features/area-requests/types"

export async function fetchAreaRequests(
  query: AreaRequestListQuery = {},
): Promise<PaginatedResponse<AreaRequest>> {
  return getJson<PaginatedResponse<AreaRequest>>("area-requests", {
    page: query.page,
    per_page: query.per_page,
    area: query.area,
    status: query.status,
    insumos_only: query.insumos_only ? 1 : undefined,
    insumos_origin: query.insumos_origin,
  })
}

export async function fetchWarehousePendingCount(): Promise<WarehousePendingCount> {
  return getJson<WarehousePendingCount>("area-requests/warehouse-pending-count")
}
