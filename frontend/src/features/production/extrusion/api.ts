import { fetchProgramacionBoard } from "@/features/programacion/api"
import { normalizeProgramacionBoard } from "@/features/programacion/board-stages"
import type { ProductionOrderRow } from "@/features/programacion/types"
import { getJson, patchJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  ExtrusionActiveSession,
  ExtrusionCloseInput,
  ExtrusionDailySummary,
  ExtrusionRunListQuery,
  ExtrusionRunListItem,
  ExtrusionRunResponse,
  ExtrusionSegmentInput,
  ExtrusionSegmentRead,
  ExtrusionSessionCreateInput,
} from "@/features/production/extrusion/types"

export async function fetchExtrusionStageWorks(): Promise<ProductionOrderRow[]> {
  const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
  return board.columns.extrusion ?? []
}

/** Trabajos elegibles para cruce de mezcla / cambio de orden (no solo etapa extrusión). */
const REASSIGN_BOARD_STAGES = ["nueva", "pendiente", "mezcla", "extrusion"] as const

export async function fetchExtrusionReassignWorks(): Promise<ProductionOrderRow[]> {
  const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
  const byId = new Map<number, ProductionOrderRow>()
  for (const stage of REASSIGN_BOARD_STAGES) {
    for (const work of board.columns[stage] ?? []) {
      byId.set(work.id, work)
    }
  }
  const allPlant = Object.values(board.columns).flat()
  for (const workOrderId of board.active_extrusion_work_order_ids ?? []) {
    const work = allPlant.find((row) => row.id === workOrderId)
    if (work) byId.set(work.id, work)
  }
  return [...byId.values()].sort((a, b) => b.id - a.id)
}

export async function fetchAllPlantWorks(): Promise<ProductionOrderRow[]> {
  const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
  return Object.values(board.columns).flat()
}

export async function fetchActiveExtrusionSession(
  workOrderId: number,
): Promise<ExtrusionActiveSession | null> {
  return getJson<ExtrusionActiveSession | null>("extrusion-runs/active", {
    work_order_id: workOrderId,
  })
}

export async function createExtrusionSession(
  workOrderId: number,
  options: Omit<ExtrusionSessionCreateInput, "work_order_id"> = {},
): Promise<ExtrusionActiveSession> {
  return postJson<ExtrusionActiveSession>("extrusion-runs/sessions", {
    work_order_id: workOrderId,
    ...options,
  })
}

export async function addExtrusionSegment(
  sessionId: number,
  input: ExtrusionSegmentInput,
): Promise<ExtrusionSegmentRead> {
  return postJson<ExtrusionSegmentRead>(`extrusion-runs/${sessionId}/segments`, input)
}

export async function closeExtrusionSession(
  sessionId: number,
  input: ExtrusionCloseInput = {},
): Promise<ExtrusionRunResponse> {
  return postJson<ExtrusionRunResponse>(`extrusion-runs/${sessionId}/close`, input)
}

export async function fetchExtrusionRuns(
  query: ExtrusionRunListQuery = {},
): Promise<PaginatedResponse<ExtrusionRunListItem>> {
  return getJson<PaginatedResponse<ExtrusionRunListItem>>("extrusion-runs", {
    page: query.page,
    per_page: query.per_page,
    work_order_id: query.work_order_id,
    include_reassigned: query.include_reassigned ? 1 : undefined,
    on_date: query.on_date,
    shift: query.shift,
    machine: query.machine,
  })
}

export async function fetchExtrusionDailySummary(
  onDate?: string,
): Promise<ExtrusionDailySummary[]> {
  return getJson<ExtrusionDailySummary[]>("extrusion-runs/daily-summary", {
    on_date: onDate,
  })
}

export async function reassignExtrusionRun(
  runId: number,
  input: {
    reassigned_work_order_id?: number | null
    mixture_source_work_order_id?: number | null
  },
): Promise<ExtrusionRunListItem> {
  return patchJson<ExtrusionRunListItem>(`extrusion-runs/${runId}/reassign`, input)
}
