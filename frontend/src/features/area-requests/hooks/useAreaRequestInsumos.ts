import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  authorizeMaterialRequest,
  closeMaterialRequest,
  dispatchMaterialRequest,
  fetchMaterialRequest,
  receiveMaterialRequest,
  rejectMaterialRequest,
} from "@/features/material-requests/api"
import { AREA_REQUEST_LABELS } from "@/features/area-requests/labels"
import {
  MATERIAL_REQUEST_UNITS,
} from "@/features/material-requests/labels"
import type { MaterialRequestDetail } from "@/features/material-requests/types"
import { ApiError } from "@/shared/api/client"

export type DispatchLineForm = {
  key: string
  material_request_line_id: number
  material_id?: number | null
  description: string
  quantity_requested: number
  quantity_dispatched: number
  pending: number
  unit: string
  quantity: string
}

export type CounterLineForm = {
  key: string
  material_id: string
  description: string
  quantity_requested: string
  unit: string
}

let lineKeySeq = 0

function newLineKey(prefix: string): string {
  lineKeySeq += 1
  return `${prefix}-${lineKeySeq}`
}

function emptyCounterLine(): CounterLineForm {
  return {
    key: newLineKey("cline"),
    material_id: "",
    description: "",
    quantity_requested: "",
    unit: "kg",
  }
}

function lineRemaining(requested: string | number, dispatched: string | number): number {
  const r = Number(requested ?? 0)
  const d = Number(dispatched ?? 0)
  if (!Number.isFinite(r) || !Number.isFinite(d)) return 0
  return Math.max(0, r - d)
}

const NON_DISPATCH_STATUSES = new Set([
  "cancelled",
  "dispatched",
  "rejected",
  "counter_proposed",
  "counter_rejected",
  "closed",
])

const CLOSABLE_STATUSES = new Set(["pending", "authorized", "partial"])

const REJECTABLE_STATUSES = new Set(["pending", "authorized", "partial"])

export function useAreaRequestInsumos(materialRequestId: number | null) {
  const [detail, setDetail] = useState<MaterialRequestDetail | null>(null)
  const [lines, setLines] = useState<DispatchLineForm[]>([])
  const [rejectReason, setRejectReason] = useState("")
  const [useCounterProposal, setUseCounterProposal] = useState(false)
  const [counterLines, setCounterLines] = useState<CounterLineForm[]>([emptyCounterLine()])
  const [loading, setLoading] = useState(Boolean(materialRequestId))
  const [dispatching, setDispatching] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [closing, setClosing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!materialRequestId || materialRequestId < 1) return
    setLoading(true)
    try {
      const data = await fetchMaterialRequest(materialRequestId)
      setDetail(data)
      setLines(
        (data.lines ?? []).flatMap((line) => {
          const pending = lineRemaining(
            line.quantity_requested,
            line.quantity_dispatched ?? 0,
          )
          if (pending <= 0 || !line.id) return []
          const formLine: DispatchLineForm = {
            key: newLineKey("dline"),
            material_request_line_id: line.id,
            material_id: line.material_id,
            description:
              line.description?.trim() ||
              (line.material ? `${line.material.sku} · ${line.material.name}` : `Línea #${line.id}`),
            quantity_requested: Number(line.quantity_requested),
            quantity_dispatched: Number(line.quantity_dispatched ?? 0),
            pending,
            unit: line.unit ?? line.material?.unit ?? "kg",
            quantity: "",
          }
          return [formLine]
        }),
      )
    } catch (error) {
      setDetail(null)
      setLines([])
      const message =
        error instanceof ApiError ? error.message : AREA_REQUEST_LABELS.loadDetailError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [materialRequestId])

  useEffect(() => {
    void load()
  }, [load])

  function patchLine(key: string, quantity: string) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, quantity } : line)))
  }

  function patchCounterLine(key: string, partial: Partial<CounterLineForm>) {
    setCounterLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...partial } : line)),
    )
  }

  function addCounterLine() {
    setCounterLines((prev) => [...prev, emptyCounterLine()])
  }

  function removeCounterLine(key: string) {
    setCounterLines((prev) => {
      const next = prev.filter((line) => line.key !== key)
      return next.length ? next : [emptyCounterLine()]
    })
  }

  async function submitDispatch(): Promise<boolean> {
    if (!detail || !materialRequestId) return false

    const payloadLines = lines
      .filter((line) => line.quantity.trim())
      .map((line) => ({
        material_request_line_id: line.material_request_line_id,
        quantity: Number(line.quantity),
        material_id: line.material_id ?? undefined,
      }))

    if (!payloadLines.length) {
      toast.error(AREA_REQUEST_LABELS.qtyRequired)
      return false
    }

    for (const line of lines) {
      if (!line.quantity.trim()) continue
      const qty = Number(line.quantity)
      if (qty > line.pending + 0.0001) {
        toast.error(AREA_REQUEST_LABELS.qtyExceedsPending)
        return false
      }
    }

    setDispatching(true)
    setFieldErrors({})
    try {
      if (detail.authorized_by == null) {
        await authorizeMaterialRequest(materialRequestId)
      }
      const result = await dispatchMaterialRequest(materialRequestId, { lines: payloadLines })
      if (result.generated_mixture_id) {
        toast.success(AREA_REQUEST_LABELS.dispatchSuccessWithMixture(result.generated_mixture_id))
      } else {
        toast.success(AREA_REQUEST_LABELS.dispatchSuccess)
      }
      await load()
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : AREA_REQUEST_LABELS.dispatchError
      toast.error(message)
      return false
    } finally {
      setDispatching(false)
    }
  }

  async function submitReject(): Promise<boolean> {
    if (!detail || !materialRequestId) return false

    const reason = rejectReason.trim()
    if (!reason) {
      toast.error(AREA_REQUEST_LABELS.rejectReasonRequired)
      return false
    }

    const counterPayload = useCounterProposal
      ? counterLines
          .filter((line) => line.description.trim() && line.quantity_requested.trim())
          .map((line) => ({
            material_id: line.material_id ? Number(line.material_id) : null,
            description: line.description.trim(),
            quantity_requested: line.quantity_requested.trim(),
            unit: line.unit.trim() || "kg",
          }))
      : []

    if (useCounterProposal && !counterPayload.length) {
      toast.error(AREA_REQUEST_LABELS.counterLinesRequired)
      return false
    }

    setRejecting(true)
    setFieldErrors({})
    try {
      await rejectMaterialRequest(materialRequestId, {
        reason,
        counter_lines: counterPayload.length ? counterPayload : undefined,
      })
      toast.success(AREA_REQUEST_LABELS.rejectSuccess)
      setRejectReason("")
      setUseCounterProposal(false)
      setCounterLines([emptyCounterLine()])
      await load()
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : AREA_REQUEST_LABELS.rejectError
      toast.error(message)
      return false
    } finally {
      setRejecting(false)
    }
  }

  async function submitReceive(): Promise<boolean> {
    if (!detail || !materialRequestId) return false
    setReceiving(true)
    try {
      await receiveMaterialRequest(materialRequestId)
      toast.success(AREA_REQUEST_LABELS.receiveSuccess)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : AREA_REQUEST_LABELS.receiveError
      toast.error(message)
      return false
    } finally {
      setReceiving(false)
    }
  }

  async function submitClose(): Promise<boolean> {
    if (!detail || !materialRequestId) return false
    setClosing(true)
    try {
      await closeMaterialRequest(materialRequestId)
      toast.success(AREA_REQUEST_LABELS.closeSuccess)
      await load()
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : AREA_REQUEST_LABELS.closeError
      toast.error(message)
      return false
    } finally {
      setClosing(false)
    }
  }

  const isInbound = detail?.request_flow === "inbound"

  const canDispatch =
    detail != null &&
    !isInbound &&
    !NON_DISPATCH_STATUSES.has(detail.status) &&
    lines.length > 0

  const canReceive =
    isInbound &&
    detail != null &&
    detail.status !== "dispatched" &&
    detail.status !== "cancelled"

  const canReject = detail != null && REJECTABLE_STATUSES.has(detail.status) && !isInbound

  const canClose =
    detail != null && !isInbound && CLOSABLE_STATUSES.has(detail.status)

  const isCounterPending = detail?.status === "counter_proposed"

  return {
    detail,
    lines,
    loading,
    dispatching,
    receiving,
    rejecting,
    closing,
    fieldErrors,
    canDispatch,
    canReceive,
    isInbound,
    canReject,
    canClose,
    isCounterPending,
    rejectReason,
    setRejectReason,
    useCounterProposal,
    setUseCounterProposal,
    counterLines,
    patchCounterLine,
    addCounterLine,
    removeCounterLine,
    patchLine,
    submitDispatch,
    submitReceive,
    submitReject,
    submitClose,
    reload: load,
    unitOptions: MATERIAL_REQUEST_UNITS,
  }
}
