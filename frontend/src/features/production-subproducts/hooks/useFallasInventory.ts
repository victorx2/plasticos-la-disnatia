import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import {
  acceptFallasMaterialsShipment,
  createFallasMaterialsShipment,
  fetchFallasMaterialsPending,
  fetchFallasPending,
} from "@/features/production-subproducts/api"
import { FALLAS_LABELS } from "@/features/production-subproducts/labels"
import { SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import type { FallasMaterialsShipment, FallasPending } from "@/features/production-subproducts/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

export function useFallasInventory() {
  const [searchParams] = useSearchParams()
  const filterWorkOrderIdRaw = searchParams.get("work_order_id")
  const filterWorkOrderId =
    filterWorkOrderIdRaw && Number.isFinite(Number(filterWorkOrderIdRaw)) && Number(filterWorkOrderIdRaw) > 0
      ? Number(filterWorkOrderIdRaw)
      : null

  const [items, setItems] = useState<FallasPending[]>([])
  const [pendingShipments, setPendingShipments] = useState<FallasMaterialsShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [shippingKey, setShippingKey] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRows, shipmentRows] = await Promise.all([
        fetchFallasPending(),
        fetchFallasMaterialsPending(),
      ])
      setItems(pendingRows)
      setPendingShipments(shipmentRows)
    } catch (error) {
      setItems([])
      setPendingShipments([])
      const message = error instanceof ApiError ? error.message : FALLAS_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visibleItems = useMemo(() => {
    if (!filterWorkOrderId) return items
    return items.filter((item) => item.work_order_id === filterWorkOrderId)
  }, [items, filterWorkOrderId])

  async function ship(
    row: { workOrderId?: number | null; key: string },
    kg: string,
    notes?: string,
  ): Promise<boolean> {
    const amount = parseKgNumber(kg)
    if (amount <= 0) {
      toast.error(SUBPRODUCTS_LABELS.placeholders.kg)
      return false
    }
    setShippingKey(row.key)
    try {
      await createFallasMaterialsShipment({
        work_order_id: row.workOrderId ?? undefined,
        kg: amount,
        notes: notes?.trim() || null,
      })
      toast.success(FALLAS_LABELS.shipSuccess)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : SUBPRODUCTS_LABELS.shipError
      toast.error(message)
      return false
    } finally {
      setShippingKey(null)
    }
  }

  async function acceptShipment(id: number): Promise<void> {
    setAcceptingId(id)
    try {
      await acceptFallasMaterialsShipment(id, "Verificado en materiales")
      toast.success(FALLAS_LABELS.acceptSuccess)
      await load()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : FALLAS_LABELS.acceptError
      toast.error(message)
    } finally {
      setAcceptingId(null)
    }
  }

  return {
    filterWorkOrderId,
    items: visibleItems,
    pendingShipments,
    loading,
    shippingKey,
    ship,
    acceptShipment,
    acceptingId,
    reload: load,
  }
}
