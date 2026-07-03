import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  createBolsonesRelease,
  createDesperdicioRelease,
  fetchBolsonesInDispatch,
  fetchDesperdicioInDispatch,
} from "@/features/production-subproducts/api"
import { SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import type { SubproductInDispatch } from "@/features/production-subproducts/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

export function useDispatchSubproducts(filterWorkOrderId: number | null) {
  const [bolsones, setBolsones] = useState<SubproductInDispatch[]>([])
  const [desperdicio, setDesperdicio] = useState<SubproductInDispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [releasingKey, setReleasingKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [b, d] = await Promise.all([fetchBolsonesInDispatch(), fetchDesperdicioInDispatch()])
      setBolsones(b)
      setDesperdicio(d)
    } catch (error) {
      setBolsones([])
      setDesperdicio([])
      const message = error instanceof ApiError ? error.message : SUBPRODUCTS_LABELS.releaseError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visibleBolsones = useMemo(() => {
    if (!filterWorkOrderId) return bolsones
    return bolsones.filter((r) => r.work_order_id === filterWorkOrderId)
  }, [bolsones, filterWorkOrderId])

  const visibleDesperdicio = useMemo(() => {
    if (!filterWorkOrderId) return desperdicio
    return desperdicio.filter((r) => r.work_order_id === filterWorkOrderId)
  }, [desperdicio, filterWorkOrderId])

  async function releaseBolsones(
    row: { measure?: string | null; key: string },
    kg: string,
    notes?: string,
  ): Promise<boolean> {
    const measure = row.measure?.trim()
    const amount = parseKgNumber(kg)
    if (!measure) {
      toast.error(SUBPRODUCTS_LABELS.columns.measure)
      return false
    }
    if (amount <= 0) {
      toast.error(SUBPRODUCTS_LABELS.releasePlaceholder)
      return false
    }
    setReleasingKey(row.key)
    try {
      await createBolsonesRelease({
        measure,
        kg: amount,
        notes: notes?.trim() || null,
      })
      toast.success(SUBPRODUCTS_LABELS.releaseSuccessBolsones)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : SUBPRODUCTS_LABELS.releaseError
      toast.error(message)
      return false
    } finally {
      setReleasingKey(null)
    }
  }

  async function releaseDesperdicio(
    row: { workOrderId?: number | null; manualEntryId?: number | null; key: string },
    kg: string,
    notes?: string,
  ): Promise<boolean> {
    const amount = parseKgNumber(kg)
    if (amount <= 0) {
      toast.error(SUBPRODUCTS_LABELS.releasePlaceholder)
      return false
    }
    setReleasingKey(row.key)
    try {
      await createDesperdicioRelease({
        work_order_id: row.workOrderId ?? undefined,
        manual_entry_id: row.manualEntryId ?? undefined,
        kg: amount,
        notes: notes?.trim() || null,
      })
      toast.success(SUBPRODUCTS_LABELS.releaseSuccessDesperdicio)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : SUBPRODUCTS_LABELS.releaseError
      toast.error(message)
      return false
    } finally {
      setReleasingKey(null)
    }
  }

  return {
    bolsones: visibleBolsones,
    desperdicio: visibleDesperdicio,
    loading,
    releasingKey,
    releaseBolsones,
    releaseDesperdicio,
    reload: load,
  }
}
