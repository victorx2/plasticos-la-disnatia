import { fetchActiveExtrusionSession } from "@/features/production/extrusion/api"
import { fetchProgramacionBoard } from "@/features/programacion/api"
import { normalizeBoardStage } from "@/features/programacion/board-stages"
import { fetchMixtureProductionRuns } from "@/features/tinta-mixtures/production-api"
import type { ProductionFlowStep } from "@/features/production/shared/labels"

export type WorkProductionResume = {
  workOrderId: number
  boardStage: string | null
  activeMixtureRunId: number | null
  /** Sesión de extrusión abierta (in_progress) — única señal fiable para reanudar. */
  hasActiveExtrusion: boolean
}

export function extrusionRegisterHref(workOrderId: number, mixtureRunId?: number | null): string {
  const base = `/extrusion/registro?work_order_id=${workOrderId}`
  if (mixtureRunId != null && mixtureRunId > 0) {
    return `${base}&mixture_run_id=${mixtureRunId}`
  }
  return base
}

export function mezclaWorkHref(workOrderId: number): string {
  return `/mezcla?work_order_id=${workOrderId}`
}

export function isExtrusionResume(resume: WorkProductionResume | null | undefined): boolean {
  return Boolean(resume?.hasActiveExtrusion)
}

export function resolveExtrusionHref(
  workOrderId: number,
  resume?: WorkProductionResume | null,
): string {
  if (isExtrusionResume(resume)) {
    return extrusionRegisterHref(workOrderId, resume?.activeMixtureRunId)
  }
  return extrusionRegisterHref(workOrderId)
}

export function resolveProductionStepHref(
  step: ProductionFlowStep,
  workOrderId?: number | null,
  resume?: WorkProductionResume | null,
): string {
  const wid = workOrderId != null && workOrderId > 0 ? workOrderId : null

  switch (step) {
    case "orden":
      return "/orden-produccion"
    case "programacion":
      return "/programacion"
    case "mezcla":
      return wid ? mezclaWorkHref(wid) : "/mezcla"
    case "extrusion":
      return wid ? resolveExtrusionHref(wid, resume) : "/extrusion"
    case "sellado":
      return wid ? `/sellado/registro?work_order_id=${wid}` : "/sellado"
  }
}

function findBoardStage(workOrderId: number, columns: Record<string, { id: number }[]>): string | null {
  for (const [stage, orders] of Object.entries(columns)) {
    if (orders.some((order) => order.id === workOrderId)) {
      return normalizeBoardStage(stage)
    }
  }
  return null
}

export async function fetchWorkProductionResume(workOrderId: number): Promise<WorkProductionResume> {
  const [runsRes, activeSession, board] = await Promise.all([
    fetchMixtureProductionRuns({ work_order_id: workOrderId, status: "in_progress", per_page: 10 }),
    fetchActiveExtrusionSession(workOrderId).catch(() => null),
    fetchProgramacionBoard().catch(() => null),
  ])

  const hasActiveExtrusion = Boolean(activeSession?.session)
  const activeRun = hasActiveExtrusion
    ? runsRes.data.find((run) => run.extrusion_run_id === activeSession?.session?.id) ??
      runsRes.data[0] ??
      null
    : null
  const boardStage = board ? findBoardStage(workOrderId, board.columns) : null

  return {
    workOrderId,
    boardStage,
    activeMixtureRunId: activeRun?.id ?? null,
    hasActiveExtrusion,
  }
}
