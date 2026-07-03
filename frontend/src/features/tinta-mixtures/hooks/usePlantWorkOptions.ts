import { useCallback, useEffect, useState } from "react"

import { fetchProgramacionBoard } from "@/features/programacion/api"
import { normalizeProgramacionBoard } from "@/features/programacion/board-stages"
import type { ProductionOrderRow } from "@/features/programacion/types"
import { formatOrderQuantity } from "@/features/tinta-mixtures/domain/mixturePrefill"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import { ApiError } from "@/shared/api/client"

function flattenBoardWorks(columns: Record<string, ProductionOrderRow[]>): ProductionOrderRow[] {
  const byId = new Map<number, ProductionOrderRow>()
  for (const rows of Object.values(columns)) {
    for (const row of rows) {
      byId.set(row.id, row)
    }
  }
  return [...byId.values()].sort((a, b) => a.code.localeCompare(b.code))
}

export function formatPlantWorkLabel(work: ProductionOrderRow): string {
  const client = work.client?.name ?? "—"
  const product = work.product?.name
  const base = product ? `${work.code} · ${client} · ${product}` : `${work.code} · ${client}`
  const qty = formatOrderQuantity(work.order_quantity, work.order_unit)
  return qty ? `${base} · ${qty}` : base
}

export function usePlantWorkOptions() {
  const [works, setWorks] = useState<ProductionOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const board = normalizeProgramacionBoard(await fetchProgramacionBoard())
      setWorks(flattenBoardWorks(board.columns))
    } catch (err) {
      setWorks([])
      setError(err instanceof ApiError ? err.message : MIXING_LABELS.loadWorksError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { works, loading, error, reload: load }
}
