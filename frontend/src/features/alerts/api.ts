import { getJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type { AlertListQuery, OperationalAlert } from "@/features/alerts/types"

export type PaginatedAlertsResponse = PaginatedResponse<OperationalAlert> & {
  unread_total: number
}

export async function fetchAlerts(query: AlertListQuery = {}): Promise<PaginatedAlertsResponse> {
  return getJson<PaginatedAlertsResponse>("operational-alerts", {
    page: query.page,
    per_page: query.per_page,
    unread_only: query.unread_only === false ? 0 : 1,
  })
}

export async function fetchAlertsUnreadCount(): Promise<{ count: number }> {
  return getJson<{ count: number }>("operational-alerts/unread-count")
}

export async function syncOperationalAlerts(): Promise<{ synced: number; unread_count: number }> {
  return postJson<{ synced: number; unread_count: number }>("operational-alerts/sync", {})
}

export async function markAlertRead(id: number): Promise<OperationalAlert> {
  return postJson<OperationalAlert>(`operational-alerts/${id}/read`, {})
}

export async function markAllAlertsRead(): Promise<{ updated: number }> {
  return postJson<{ updated: number }>("operational-alerts/read-all", {})
}
