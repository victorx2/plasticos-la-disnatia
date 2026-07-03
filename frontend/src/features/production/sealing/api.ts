import { fetchProgramacionBoard } from "@/features/programacion/api"
import { normalizeProgramacionBoard } from "@/features/programacion/board-stages"
import type { ProductionOrderRow } from "@/features/programacion/types"
import { getJson, postJson } from "@/shared/api/client"
import type {
  PaginatedSealingRuns,
  SealingExtrusionCoilRead,
  SealingRunInput,
  SealingRunRead,
} from "@/features/production/sealing/types"

export async function fetchSealingStageWorks(): Promise<ProductionOrderRow[]> {
  const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
  return [...(board.columns.extrusion ?? []), ...(board.columns.completada ?? [])]
}

export async function fetchAllPlantWorksForSealing(): Promise<ProductionOrderRow[]> {
  const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
  return Object.values(board.columns).flat()
}

export async function fetchSealingExtrusionCoils(
  workOrderId: number,
): Promise<SealingExtrusionCoilRead[]> {
  return getJson<SealingExtrusionCoilRead[]>("sealing-runs/extrusion-coils", {
    work_order_id: workOrderId,
  })
}

export async function createSealingRun(input: SealingRunInput): Promise<SealingRunRead> {
  return postJson<SealingRunRead>("sealing-runs", input)
}

export async function fetchSealingRuns(params?: {
  page?: number
  per_page?: number
  work_order_id?: number
}): Promise<PaginatedSealingRuns> {
  return getJson<PaginatedSealingRuns>("sealing-runs", params)
}
