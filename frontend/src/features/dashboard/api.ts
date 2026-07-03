import { getJson } from "@/shared/api/client"
import type { DashboardSummaryDto } from "@/features/dashboard/types"

export async function fetchDashboardSummary(): Promise<DashboardSummaryDto> {
  return getJson<DashboardSummaryDto>("dashboard/summary")
}
