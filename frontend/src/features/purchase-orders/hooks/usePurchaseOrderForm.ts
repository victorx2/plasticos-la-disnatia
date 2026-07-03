import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  createPurchaseOrder,
  fetchNextPoCode,
  fetchPurchaseOrder,
  updatePurchaseOrder,
} from "@/features/purchase-orders/api"
import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import { toDateInputValue } from "@/features/purchase-orders/code"
import type { PurchaseOrderInput, PurchaseOrderLineInput } from "@/features/purchase-orders/types"
import { ApiError } from "@/shared/api/client"

export type PurchaseOrderLineForm = {
  key: string
  id?: number
  material_id: string
  description: string
  quantity_ordered: string
  unit: string
  unit_price: string
  quantity_received?: string
}

export type PurchaseOrderFormState = {
  supplier_id: string
  code: string
  ordered_at: string
  notes: string
  tax_applies: boolean
  change_reason: string
  lines: PurchaseOrderLineForm[]
}

let lineKeySeq = 0

function newLineKey(): string {
  lineKeySeq += 1
  return `line-${lineKeySeq}`
}

export function emptyLine(): PurchaseOrderLineForm {
  return {
    key: newLineKey(),
    material_id: "",
    description: "",
    quantity_ordered: "",
    unit: "kg",
    unit_price: "",
  }
}

function lineFromApi(line: {
  id?: number
  material_id?: number | null
  description?: string | null
  quantity_ordered: string | number
  quantity_received?: string | number
  unit?: string | null
  unit_price?: string | number | null
  material?: { name?: string | null; unit?: string | null } | null
}): PurchaseOrderLineForm {
  return {
    key: newLineKey(),
    id: line.id,
    material_id: line.material_id ? String(line.material_id) : "",
    description: line.description?.trim() || line.material?.name?.trim() || "",
    quantity_ordered: String(line.quantity_ordered ?? ""),
    quantity_received: line.quantity_received != null ? String(line.quantity_received) : undefined,
    unit: line.unit?.trim() || line.material?.unit?.trim() || "kg",
    unit_price: line.unit_price != null ? String(line.unit_price) : "",
  }
}

const EMPTY_HEADER = {
  supplier_id: "",
  code: "",
  ordered_at: toDateInputValue(null),
  notes: "",
  tax_applies: true,
  change_reason: "",
}

function toPayload(
  form: PurchaseOrderFormState,
  isEdit: boolean,
): Record<string, unknown> {
  const lines: PurchaseOrderLineInput[] = form.lines
    .filter((line) => line.quantity_ordered.trim())
    .map((line) => ({
      id: line.id,
      material_id: line.material_id ? Number(line.material_id) : null,
      description: line.description.trim() || null,
      quantity_ordered: line.quantity_ordered.trim(),
      unit: line.unit.trim() || "kg",
      unit_price: line.unit_price.trim() || null,
    }))

  if (isEdit) {
    return {
      supplier_id: Number(form.supplier_id),
      ordered_at: form.ordered_at || null,
      notes: form.notes.trim() || null,
      tax_applies: form.tax_applies,
      lines,
      change_reason: form.change_reason.trim(),
    }
  }

  return {
    supplier_id: Number(form.supplier_id),
    code: form.code.trim(),
    ordered_at: form.ordered_at || null,
    notes: form.notes.trim() || null,
    tax_applies: form.tax_applies,
    lines,
  }
}

export function usePurchaseOrderForm(orderId: number | null) {
  const isEdit = orderId != null && orderId > 0
  const [form, setForm] = useState<PurchaseOrderFormState>({
    ...EMPTY_HEADER,
    lines: [emptyLine()],
  })
  const [loading, setLoading] = useState(isEdit)
  const [loadingCode, setLoadingCode] = useState(!isEdit)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [hasReceipts, setHasReceipts] = useState(false)

  const patch = useCallback((partial: Partial<Omit<PurchaseOrderFormState, "lines">>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  const patchLine = useCallback((key: string, partial: Partial<PurchaseOrderLineForm>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => (line.key === key ? { ...line, ...partial } : line)),
    }))
  }, [])

  const addLine = useCallback(() => {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }))
  }, [])

  const removeLine = useCallback((key: string) => {
    setForm((prev) => {
      const next = prev.lines.filter((line) => line.key !== key)
      return { ...prev, lines: next.length ? next : [emptyLine()] }
    })
  }, [])

  useEffect(() => {
    if (isEdit) return

    let cancelled = false
    setLoadingCode(true)
    void (async () => {
      try {
        const code = await fetchNextPoCode()
        if (!cancelled) patch({ code })
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : PURCHASE_ORDER_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoadingCode(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, patch])

  useEffect(() => {
    if (!isEdit || orderId == null) return

    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const order = await fetchPurchaseOrder(orderId)
        if (cancelled) return

        const lines = order.lines?.length
          ? order.lines.map(lineFromApi)
          : [emptyLine()]

        setHasReceipts((order.receipts_count ?? 0) > 0)
        setForm({
          supplier_id: String(order.supplier_id ?? ""),
          code: order.code ?? "",
          ordered_at: toDateInputValue(order.ordered_at ?? order.created_at),
          notes: order.notes ?? "",
          tax_applies: order.tax_applies !== false,
          change_reason: "",
          lines,
        })
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : PURCHASE_ORDER_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEdit, orderId])

  async function submit(): Promise<boolean> {
    const errors: Record<string, string> = {}
    const supplierId = Number(form.supplier_id)
    if (!form.supplier_id || !Number.isFinite(supplierId) || supplierId <= 0) {
      errors.supplier_id = PURCHASE_ORDER_LABELS.validation.supplier
    }
    if (!isEdit && !form.code.trim()) {
      errors.code = PURCHASE_ORDER_LABELS.validation.code
    }
    if (isEdit && form.change_reason.trim().length < 5) {
      errors.change_reason = PURCHASE_ORDER_LABELS.validation.changeReason
    }

    const validLines = form.lines.filter((line) => line.quantity_ordered.trim())
    if (!validLines.length) {
      errors.lines = PURCHASE_ORDER_LABELS.linesMinError
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error(
        errors.lines ? PURCHASE_ORDER_LABELS.linesMinError : PURCHASE_ORDER_LABELS.validation.summary,
      )
      return false
    }

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload(form, isEdit)
      if (isEdit && orderId != null) {
        await updatePurchaseOrder(orderId, payload as Partial<PurchaseOrderInput>)
      } else {
        await createPurchaseOrder(payload as PurchaseOrderInput)
      }
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : PURCHASE_ORDER_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    form,
    patch,
    patchLine,
    addLine,
    removeLine,
    loading: loading || loadingCode,
    saving,
    isEdit,
    hasReceipts,
    fieldErrors,
    submit,
  }
}
