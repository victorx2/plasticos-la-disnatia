import type { BoardStage, ProgramacionBoard, ProductionOrderRow } from "@/features/programacion/types"
import { BOARD_STAGES } from "@/features/programacion/types"

const LEGACY_TO_STAGE: Record<string, BoardStage> = {
  montaje: "pendiente",
  impresion: "mezcla",
  laminacion: "mezcla",
  corte: "extrusion",
}

export function normalizeBoardStage(stage: string | undefined | null): BoardStage {
  if (!stage) return "nueva"
  if ((BOARD_STAGES as readonly string[]).includes(stage)) return stage as BoardStage
  return LEGACY_TO_STAGE[stage] ?? "pendiente"
}

export function normalizeProgramacionBoard(data: ProgramacionBoard): ProgramacionBoard {
  const columns = Object.fromEntries(
    BOARD_STAGES.map((stage) => [stage, [] as ProductionOrderRow[]]),
  ) as Record<BoardStage, ProductionOrderRow[]>

  for (const orders of Object.values(data.columns)) {
    for (const order of orders) {
      const stage = normalizeBoardStage(order.board_stage)
      columns[stage].push({ ...order, board_stage: stage })
    }
  }

  return {
    ...data,
    columns,
    active_extrusion_work_order_ids: data.active_extrusion_work_order_ids ?? [],
  }
}
