import { getJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  MixtureBeginExtrusionResult,
  MixtureProductionCompleteInput,
  MixtureProductionHistoryEntry,
  MixtureProductionListQuery,
  MixtureProductionRun,
  MixtureProductionRunInput,
  MixtureReturnToWarehouseInput,
  MixtureReturnToWarehouseResult,
} from "@/features/tinta-mixtures/production-types"

export async function fetchMixtureProductionRuns(
  query: MixtureProductionListQuery = {},
): Promise<PaginatedResponse<MixtureProductionRun>> {
  return getJson<PaginatedResponse<MixtureProductionRun>>("mixture-production-runs", {
    page: query.page,
    per_page: query.per_page,
    work_order_id: query.work_order_id,
    status: query.status,
  })
}

export async function startMixtureProduction(
  input: MixtureProductionRunInput,
): Promise<MixtureProductionRun> {
  return postJson<MixtureProductionRun>("mixture-production-runs", input)
}

export async function beginMixtureExtrusion(runId: number): Promise<MixtureBeginExtrusionResult> {
  return postJson<MixtureBeginExtrusionResult>(`mixture-production-runs/${runId}/begin-extrusion`, {})
}

export async function completeMixtureProduction(
  id: number,
  input: MixtureProductionCompleteInput,
): Promise<MixtureProductionRun> {
  return postJson<MixtureProductionRun>(`mixture-production-runs/${id}/complete`, input)
}

export async function returnMixtureToWarehouse(
  id: number,
  input: MixtureReturnToWarehouseInput,
): Promise<MixtureReturnToWarehouseResult> {
  return postJson<MixtureReturnToWarehouseResult>(
    `mixture-production-runs/${id}/return-to-warehouse`,
    input,
  )
}

export async function fetchMixtureProductionHistory(
  workOrderId: number,
): Promise<MixtureProductionHistoryEntry[]> {
  return getJson<MixtureProductionHistoryEntry[]>(`mixture-production-runs/history`, {
    work_order_id: workOrderId,
  })
}
