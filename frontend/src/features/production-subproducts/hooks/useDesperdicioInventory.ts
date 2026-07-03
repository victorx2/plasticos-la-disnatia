import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import {
  createDesperdicioEntry,
  createDesperdicioShipment,
  fetchDesperdicioPending,
} from "@/features/production-subproducts/api"
import { DESPERDICIO_LABELS, SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import type { DesperdicioPending } from "@/features/production-subproducts/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

export function useDesperdicioInventory() {
  const [searchParams] = useSearchParams()
  const filterWorkOrderIdRaw = searchParams.get("work_order_id")
  const filterWorkOrderId =
    filterWorkOrderIdRaw && Number.isFinite(Number(filterWorkOrderIdRaw)) && Number(filterWorkOrderIdRaw) > 0
      ? Number(filterWorkOrderIdRaw)
      : null

  const [items, setItems] = useState<DesperdicioPending[]>([])
  const [loading, setLoading] = useState(true)
  const [shippingKey, setShippingKey] = useState<string | null>(null)
  const [entryDescription, setEntryDescription] = useState("")
  const [entryWasteType, setEntryWasteType] = useState<"refil" | "transparente" | "">("")
  const [entryKg, setEntryKg] = useState("")
  const [entryNotes, setEntryNotes] = useState("")
  const [entrySaving, setEntrySaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await fetchDesperdicioPending())
    } catch (error) {
      setItems([])
      const message = error instanceof ApiError ? error.message : DESPERDICIO_LABELS.loadError
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
    row: { workOrderId?: number | null; manualEntryId?: number | null; key: string },
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
      await createDesperdicioShipment({
        work_order_id: row.workOrderId ?? undefined,
        manual_entry_id: row.manualEntryId ?? undefined,
        kg: amount,
        notes: notes?.trim() || null,
      })
      toast.success(DESPERDICIO_LABELS.shipSuccess)
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
    const description = entryDescription.trim()
    const amount = parseKgNumber(entryKg)
    if (!description) {
      toast.error(DESPERDICIO_LABELS.entryValidationDescription)
      return false
    }
    if (amount <= 0) {
      toast.error(DESPERDICIO_LABELS.entryValidationKg)
      return false
    }
    if (!entryWasteType) {
      toast.error(DESPERDICIO_LABELS.entryValidationWasteType)
      return false
    }
    setEntrySaving(true)
    try {
      await createDesperdicioEntry({
        description,
        waste_type: entryWasteType,
        kg: amount,
        notes: entryNotes.trim() || null,
      })
      toast.success(DESPERDICIO_LABELS.entrySuccess)
      setEntryDescription("")
      setEntryWasteType("")
      setEntryKg("")
      setEntryNotes("")
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : DESPERDICIO_LABELS.entryError
      toast.error(message)
      return false
    } finally {
      setEntrySaving(false)
    }
  }

  return {
    filterWorkOrderId,
    items: visibleItems,
    loading,
    shippingKey,
    ship,
    reload: load,
    entryDescription,
    setEntryDescription,
    entryWasteType,
    setEntryWasteType,
    entryKg,
    setEntryKg,
    entryNotes,
    setEntryNotes,
    entrySaving,
    registerEntry,
  }
}
