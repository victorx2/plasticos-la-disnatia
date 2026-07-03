import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { createDispatchPalletsBatch, fetchBobinasAvailable, fetchDispatchPallets } from "@/features/dispatch/api"
import { openBatchCoilLabelsPrint } from "@/features/dispatch/components/DispatchCoilLabelPrint"
import { openPackingListPrint } from "@/features/dispatch/components/DispatchPackingListPrint"
import { DISPATCH_LABELS } from "@/features/dispatch/labels"
import type { BobinaAvailable, DispatchPallet, DispatchPalletListItem } from "@/features/dispatch/types"
import { ApiError } from "@/shared/api/client"
import { parseKgNumber } from "@/shared/format/numbers"

export type PalletDraft = {
  key: string
  coilIds: number[]
  coilWeights: Record<number, string>
  coilShifts: Record<number, string>
  clientName: string
  destination: string
  productName: string
  measurements: string
  notes: string
}

let draftKey = 0

function newDraftKey(): string {
  draftKey += 1
  return `pallet-${draftKey}`
}

function emptyDraft(): PalletDraft {
  return {
    key: newDraftKey(),
    coilIds: [],
    coilWeights: {},
    coilShifts: {},
    clientName: "",
    destination: "",
    productName: "",
    measurements: "",
    notes: "",
  }
}

function inferShiftFromRecordedAt(value?: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const hour = d.getHours()
  if (hour < 12) return "mañana"
  if (hour < 18) return "tarde"
  return "noche"
}

function resolveCoilShift(
  draft: PalletDraft,
  coilId: number,
  bobinas: BobinaAvailable[],
): string {
  const manual = draft.coilShifts[coilId]?.trim()
  if (manual) return manual
  const bobina = bobinas.find((b) => b.id === coilId)
  return bobina?.shift?.trim() || inferShiftFromRecordedAt(bobina?.recorded_at) || ""
}

export function useDispatchWizard() {
  const [searchParams] = useSearchParams()
  const filterWorkOrderIdRaw = searchParams.get("work_order_id")
  const filterWorkOrderId =
    filterWorkOrderIdRaw && Number.isFinite(Number(filterWorkOrderIdRaw)) && Number(filterWorkOrderIdRaw) > 0
      ? Number(filterWorkOrderIdRaw)
      : null

  const [bobinas, setBobinas] = useState<BobinaAvailable[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [drafts, setDrafts] = useState<PalletDraft[]>([emptyDraft()])
  const [activeDraftKey, setActiveDraftKey] = useState(drafts[0]?.key ?? "")
  const [history, setHistory] = useState<DispatchPalletListItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyFromDate, setHistoryFromDate] = useState("")
  const [historyToDate, setHistoryToDate] = useState("")
  const [confirming, setConfirming] = useState(false)
  const [lastConfirmedPallets, setLastConfirmedPallets] = useState<DispatchPallet[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchBobinasAvailable()
      setBobinas(data)
    } catch (error) {
      setBobinas([])
      const message = error instanceof ApiError ? error.message : DISPATCH_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const data = await fetchDispatchPallets({
        work_order_id: filterWorkOrderId ?? undefined,
        from_date: historyFromDate || undefined,
        to_date: historyToDate || undefined,
        limit: 100,
      })
      setHistory(data)
    } catch (error) {
      setHistory([])
      const message = error instanceof ApiError ? error.message : DISPATCH_LABELS.historyLoadError
      toast.error(message)
    } finally {
      setHistoryLoading(false)
    }
  }, [filterWorkOrderId, historyFromDate, historyToDate])

  useEffect(() => {
    void load()
    void loadHistory()
  }, [load, loadHistory])

  const activeDraft = useMemo(
    () => drafts.find((d) => d.key === activeDraftKey) ?? drafts[0],
    [drafts, activeDraftKey],
  )

  const assignedIds = useMemo(() => {
    const ids = new Set<number>()
    for (const draft of drafts) {
      for (const id of draft.coilIds) ids.add(id)
    }
    return ids
  }, [drafts])

  const filteredBobinas = useMemo(() => {
    if (!filterWorkOrderId) return bobinas
    return bobinas.filter((b) => b.work_order_id === filterWorkOrderId)
  }, [bobinas, filterWorkOrderId])

  const availableBobinas = useMemo(
    () => filteredBobinas.filter((b) => !assignedIds.has(b.id)),
    [filteredBobinas, assignedIds],
  )

  function toggleBobina(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function assignSelectionToActiveDraft() {
    if (!activeDraft || selectedIds.size === 0) {
      toast.error(DISPATCH_LABELS.emptySelection)
      return
    }
    const ids = [...selectedIds]
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== activeDraft.key) return d
        const merged = [...new Set([...d.coilIds, ...ids])]
        const weights = { ...d.coilWeights }
        const shifts = { ...d.coilShifts }
        for (const id of ids) {
          const bobina = bobinas.find((b) => b.id === id)
          if (!(id in weights)) weights[id] = bobina?.kg && Number(bobina.kg) > 0 ? bobina.kg : ""
          if (!(id in shifts)) {
            shifts[id] =
              bobina?.shift?.trim() || inferShiftFromRecordedAt(bobina?.recorded_at) || ""
          }
        }
        return { ...d, coilIds: merged, coilWeights: weights, coilShifts: shifts }
      }),
    )
    setSelectedIds(new Set())
  }

  function addPallet() {
    const draft = emptyDraft()
    setDrafts((prev) => [...prev, draft])
    setActiveDraftKey(draft.key)
  }

  function patchDraft(key: string, partial: Partial<PalletDraft>) {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...partial } : d)))
  }

  function patchCoilWeight(draftKey: string, coilId: number, kg: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.key === draftKey ? { ...d, coilWeights: { ...d.coilWeights, [coilId]: kg } } : d,
      ),
    )
  }

  function patchCoilShift(draftKey: string, coilId: number, shift: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.key === draftKey ? { ...d, coilShifts: { ...d.coilShifts, [coilId]: shift } } : d,
      ),
    )
  }

  function draftTotalKg(draft: PalletDraft): number {
    return draft.coilIds.reduce((sum, id) => sum + parseKgNumber(draft.coilWeights[id] ?? ""), 0)
  }

  async function confirmDispatch(): Promise<void> {
    const toSend = drafts.filter((d) => d.coilIds.length > 0)
    if (!toSend.length) {
      toast.error(DISPATCH_LABELS.emptySelection)
      return
    }

    for (const draft of toSend) {
      for (const coilId of draft.coilIds) {
        const kg = parseKgNumber(draft.coilWeights[coilId] ?? "")
        if (kg <= 0) {
          const bobina = bobinas.find((b) => b.id === coilId)
          toast.error(DISPATCH_LABELS.weightRequired(bobina?.coil_code ?? String(coilId)))
          return
        }
        const shift = resolveCoilShift(draft, coilId, bobinas)
        if (!shift) {
          const bobina = bobinas.find((b) => b.id === coilId)
          toast.error(DISPATCH_LABELS.shiftRequired(bobina?.coil_code ?? String(coilId)))
          return
        }
      }
    }

    setConfirming(true)
    try {
      const batchId = crypto.randomUUID()
      const created = await createDispatchPalletsBatch({
        dispatch_batch_id: batchId,
        pallets: toSend.map((draft) => ({
          coils: draft.coilIds.map((coilId) => ({
            coil_id: coilId,
            kg: parseKgNumber(draft.coilWeights[coilId] ?? ""),
            shift: resolveCoilShift(draft, coilId, bobinas) || null,
          })),
          client_name: draft.clientName.trim() || null,
          destination: draft.destination.trim() || null,
          product_name: draft.productName.trim() || null,
          measurements: draft.measurements.trim() || null,
          notes: draft.notes.trim() || null,
        })),
      })
      setLastConfirmedPallets(created)
      toast.success(DISPATCH_LABELS.confirmSuccess)
      const printPallets = created.map((pallet) => ({
        ...pallet,
        coils:
          pallet.coils ??
          pallet.coil_codes.map((code, i) => ({
            coil_id: i,
            coil_code: code,
            kg: "0",
            shift: null,
          })),
      }))
      if (printPallets.length >= 1) {
        openPackingListPrint(printPallets)
        openBatchCoilLabelsPrint(printPallets)
      }
      const fresh = emptyDraft()
      setDrafts([fresh])
      setActiveDraftKey(fresh.key)
      await load()
      await loadHistory()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : DISPATCH_LABELS.confirmError
      toast.error(message)
    } finally {
      setConfirming(false)
    }
  }

  return {
    bobinas: availableBobinas,
    allBobinas: bobinas,
    filterWorkOrderId,
    loading,
    selectedIds,
    toggleBobina,
    drafts,
    activeDraft,
    activeDraftKey,
    setActiveDraftKey,
    assignSelectionToActiveDraft,
    addPallet,
    patchDraft,
    patchCoilWeight,
    patchCoilShift,
    draftTotalKg,
    history,
    historyLoading,
    historyFromDate,
    historyToDate,
    setHistoryFromDate,
    setHistoryToDate,
    confirming,
    confirmDispatch,
    reloadHistory: loadHistory,
    lastConfirmedPallets,
    clearLastConfirmed: () => setLastConfirmedPallets([]),
  }
}
