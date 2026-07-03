import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  fetchProgramacionBoard,
  scheduleProductionOrder,
  updateProductionOrderStage,
} from "@/features/programacion/api"
import { PROGRAMACION_LABELS } from "@/features/programacion/labels"
import type { BoardStage, ProgramacionBoard } from "@/features/programacion/types"
import { normalizeProgramacionBoard } from "@/features/programacion/board-stages"
import { ApiError } from "@/shared/api/client"

export function useProgramacionBoard() {
  const [loading, setLoading] = useState(true)
  const [board, setBoard] = useState<ProgramacionBoard | null>(null)
  const [stageTab, setStageTab] = useState<BoardStage>("nueva")
  const [busyWorkId, setBusyWorkId] = useState<number | null>(null)
  const [busyLineId, setBusyLineId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = normalizeProgramacionBoard(await fetchProgramacionBoard())
      setBoard(data)
    } catch (error) {
      setBoard(null)
      const message = error instanceof ApiError ? error.message : PROGRAMACION_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function moveStage(workId: number, boardStage: string): Promise<boolean> {
    setBusyWorkId(workId)
    try {
      await updateProductionOrderStage(workId, { board_stage: boardStage })
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : PROGRAMACION_LABELS.moveError
      toast.error(message)
      return false
    } finally {
      setBusyWorkId(null)
    }
  }

  async function scheduleLine(productionOrderId: number, lineId: number): Promise<boolean> {
    setBusyLineId(lineId)
    try {
      await scheduleProductionOrder({
        production_order_id: productionOrderId,
        client_order_line_id: lineId,
      })
      toast.success(PROGRAMACION_LABELS.scheduleSuccess)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : PROGRAMACION_LABELS.scheduleError
      toast.error(message)
      return false
    } finally {
      setBusyLineId(null)
    }
  }

  const stageOrders = board?.columns[stageTab] ?? []
  const pendingLines = board?.pending_lines ?? []

  return {
    loading,
    board,
    stageTab,
    setStageTab,
    stageOrders,
    pendingLines,
    reload: load,
    moveStage,
    scheduleLine,
    busyWorkId,
    busyLineId,
  }
}
