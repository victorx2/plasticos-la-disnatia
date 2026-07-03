import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { createBolsonesEntry, createBolsonesShipment, fetchBolsonesPending } from "@/features/production-subproducts/api"
import { BOLSONES_LABELS, SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import type { BolsonesPending } from "@/features/production-subproducts/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

export function useBolsonesInventory() {
  const [searchParams] = useSearchParams()
  const filterWorkOrderIdRaw = searchParams.get("work_order_id")
  const filterWorkOrderId =
    filterWorkOrderIdRaw && Number.isFinite(Number(filterWorkOrderIdRaw)) && Number(filterWorkOrderIdRaw) > 0
      ? Number(filterWorkOrderIdRaw)
      : null

  const [items, setItems] = useState<BolsonesPending[]>([])
  const [loading, setLoading] = useState(true)
  const [shippingKey, setShippingKey] = useState<string | null>(null)
  const [entryMeasure, setEntryMeasure] = useState("")
  const [entryKg, setEntryKg] = useState("")
  const [entryNotes, setEntryNotes] = useState("")
  const [entrySaving, setEntrySaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchBolsonesPending(filterWorkOrderId))
    } catch (error) {
      setItems([])
      const message = error instanceof ApiError ? error.message : BOLSONES_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [filterWorkOrderId])

  useEffect(() => {
    void load()
  }, [load])

  async function ship(
    row: { measure?: string | null; key: string },
    kg: string,
    notes?: string,
  ): Promise<boolean> {
    const measure = row.measure?.trim()
    const amount = parseKgNumber(kg)
    if (!measure) {
      toast.error(BOLSONES_LABELS.entryValidationMeasure)
      return false
    }
    if (amount <= 0) {
      toast.error(SUBPRODUCTS_LABELS.placeholders.kg)
      return false
    }
    setShippingKey(row.key)
    try {
      await createBolsonesShipment({
        measure,
        kg: amount,
        notes: notes?.trim() || null,
      })
      toast.success(BOLSONES_LABELS.shipSuccess)
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

  async function registerEntry(): Promise<boolean> {
    const measure = entryMeasure.trim()
    const amount = parseKgNumber(entryKg)
    if (!measure) {
      toast.error(BOLSONES_LABELS.entryValidationMeasure)
      return false
    }
    if (amount <= 0) {
      toast.error(BOLSONES_LABELS.entryValidationKg)
      return false
    }
    setEntrySaving(true)
    try {
      await createBolsonesEntry({
        measure,
        kg: amount,
        notes: entryNotes.trim() || null,
      })
      toast.success(BOLSONES_LABELS.entrySuccess)
      setEntryMeasure("")
      setEntryKg("")
      setEntryNotes("")
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : BOLSONES_LABELS.entryError
      toast.error(message)
      return false
    } finally {
      setEntrySaving(false)
    }
  }

  return {
    filterWorkOrderId,
    items,
    loading,
    shippingKey,
    ship,
    reload: load,
    entryMeasure,
    setEntryMeasure,
    entryKg,
    setEntryKg,
    entryNotes,
    setEntryNotes,
    entrySaving,
    registerEntry,
  }
}
