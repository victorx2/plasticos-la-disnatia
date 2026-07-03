import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchMaterials } from "@/features/materials/api"
import type { Material } from "@/features/materials/types"
import { fetchPurchaseOrder, fetchPurchaseOrders } from "@/features/purchase-orders/api"
import type { PurchaseOrder, PurchaseOrderLine } from "@/features/purchase-orders/types"
import { createPurchaseReceipt, checkDuplicateReceipts } from "@/features/purchase-receipts/api"
import {
  allowedUnitsForItemType,
  itemTypeFromInventoryArea,
  itemTypeRequiresDimensions,
  polRemainingQty,
} from "@/features/purchase-receipts/item-type"
import { PURCHASE_RECEIPT_LABELS } from "@/features/purchase-receipts/labels"
import type {
  PurchaseReceiptInput,
  PurchaseReceiptLineInput,
  ReceiptItemTypeApi,
} from "@/features/purchase-receipts/types"
import { ApiError } from "@/shared/api/client"
import { fetchAllPages } from "@/shared/api/fetchAllPages"

export type ReceiptLineForm = {
  key: string
  purchase_order_line_id: number
  material_id: string
  item_type: ReceiptItemTypeApi
  description: string
  quantity: string
  unit: string
  micras: string
  ancho_mm: string
  pending_qty: number
  included: boolean
}

export type PurchaseReceiptFormState = {
  purchase_order_id: string
  supplier_id: string
  supplier_name: string
  purchase_order_reference: string
  invoice_number: string
  received_at: string
  notes: string
  lines: ReceiptLineForm[]
}

let lineKeySeq = 0

function newLineKey(): string {
  lineKeySeq += 1
  return `rline-${lineKeySeq}`
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10)
}

function lineFromPoLine(
  pol: PurchaseOrderLine,
  materials: Material[],
): ReceiptLineForm | null {
  const pending = polRemainingQty(pol.quantity_ordered, pol.quantity_received)
  if (pending <= 0 || !pol.id) return null

  const matFromList = pol.material_id
    ? materials.find((m) => m.id === pol.material_id)
    : pol.material
      ? materials.find((m) => m.id === pol.material?.id)
      : undefined

  const mat = matFromList ?? (pol.material as Material | undefined)
  const itemType = mat
    ? itemTypeFromInventoryArea(mat.inventory_area)
    : ("sustrato" as ReceiptItemTypeApi)

  return {
    key: newLineKey(),
    purchase_order_line_id: pol.id,
    material_id: mat ? String(mat.id) : pol.material_id ? String(pol.material_id) : "",
    item_type: itemType,
    description:
      pol.description?.trim() ||
      (mat ? `${mat.sku} · ${mat.name}` : pol.material?.name ?? ""),
    quantity: "",
    unit: (pol.unit || mat?.unit || "kg").trim(),
    micras: mat?.micras ?? "",
    ancho_mm: mat?.ancho ?? "",
    pending_qty: pending,
    included: true,
  }
}

function buildLinesFromPo(po: PurchaseOrder, materials: Material[]): ReceiptLineForm[] {
  const lines = (po.lines ?? [])
    .map((pol) => lineFromPoLine(pol, materials))
    .filter((line): line is ReceiptLineForm => line != null)
  return lines.length ? lines : []
}

export function usePurchaseReceiptForm(initialPoId: number | null) {
  const [form, setForm] = useState<PurchaseReceiptFormState>({
    purchase_order_id: initialPoId ? String(initialPoId) : "",
    supplier_id: "",
    supplier_name: "",
    purchase_order_reference: "",
    invoice_number: "",
    received_at: todayDateInput(),
    notes: "",
    lines: [],
  })
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingPo, setLoadingPo] = useState(Boolean(initialPoId))
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const patch = useCallback((partial: Partial<Omit<PurchaseReceiptFormState, "lines">>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }, [])

  const patchLine = useCallback((key: string, partial: Partial<ReceiptLineForm>) => {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => {
        if (line.key !== key) return line
        const next = { ...line, ...partial }
        if (partial.item_type) {
          const allowed = allowedUnitsForItemType(partial.item_type)
          if (!allowed.includes(next.unit)) next.unit = allowed[0] ?? "kg"
        }
        return next
      }),
    }))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingOrders(true)
    void (async () => {
      try {
        const [ordersRes, materials] = await Promise.all([
          fetchPurchaseOrders({ has_receipts: false, per_page: 100, page: 1 }),
          fetchAllPages(fetchMaterials, {}),
        ])
        if (!cancelled) {
          setPendingOrders(ordersRes.data)
          setMaterials(materials)
        }
      } catch {
        if (!cancelled) {
          setPendingOrders([])
          setMaterials([])
        }
      } finally {
        if (!cancelled) setLoadingOrders(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadPurchaseOrder = useCallback(
    async (poId: number) => {
      setLoadingPo(true)
      try {
        const po = await fetchPurchaseOrder(poId)
        const lines = buildLinesFromPo(po, materials)
        setForm((prev) => ({
          ...prev,
          purchase_order_id: String(po.id),
          supplier_id: String(po.supplier_id ?? ""),
          supplier_name: po.supplier?.name ?? "",
          purchase_order_reference: po.code ?? "",
          lines,
        }))
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : PURCHASE_RECEIPT_LABELS.loadPoError
        toast.error(message)
      } finally {
        setLoadingPo(false)
      }
    },
    [materials],
  )

  useEffect(() => {
    if (!initialPoId || initialPoId < 1 || loadingOrders || materials.length === 0) return
    void loadPurchaseOrder(initialPoId)
  }, [initialPoId, loadingOrders, materials.length, loadPurchaseOrder])

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!form.purchase_order_id.trim()) {
      next.purchase_order_id = PURCHASE_RECEIPT_LABELS.poRequired
    }
    if (!form.invoice_number.trim()) {
      next.invoice_number = PURCHASE_RECEIPT_LABELS.invoiceRequired
    }
    if (!form.received_at.trim()) {
      next.received_at = PURCHASE_RECEIPT_LABELS.receivedAtRequired
    }

    const activeLines = form.lines.filter((line) => line.included && line.quantity.trim())
    if (!activeLines.length) {
      next.lines = PURCHASE_RECEIPT_LABELS.linesMinError
    }

    for (let i = 0; i < activeLines.length; i++) {
      const line = activeLines[i]
      const qty = Number(line.quantity)
      if (!line.material_id.trim()) {
        next[`lines.${i}.material_id`] = PURCHASE_RECEIPT_LABELS.materialRequired
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        next[`lines.${i}.quantity`] = PURCHASE_RECEIPT_LABELS.linesMinError
      } else if (qty > line.pending_qty + 0.0001) {
        next[`lines.${i}.quantity`] = PURCHASE_RECEIPT_LABELS.qtyExceedsPending
      }
      if (itemTypeRequiresDimensions(line.item_type)) {
        const micras = Number(line.micras)
        const ancho = Number(line.ancho_mm)
        if (!Number.isFinite(micras) || micras <= 0 || !Number.isFinite(ancho) || ancho <= 0) {
          next[`lines.${i}.dimensions`] = PURCHASE_RECEIPT_LABELS.dimensionsRequired
        }
      }
    }

    setFieldErrors(next)
    if (Object.keys(next).length) {
      const first = Object.values(next)[0]
      if (first) toast.error(first)
      return false
    }
    return true
  }

  function toPayload(): PurchaseReceiptInput {
    const lines: PurchaseReceiptLineInput[] = form.lines
      .filter((line) => line.included && line.quantity.trim())
      .map((line) => {
        const payload: PurchaseReceiptLineInput = {
          purchase_order_line_id: line.purchase_order_line_id,
          material_id: Number(line.material_id),
          item_type: line.item_type,
          quantity: line.quantity.trim(),
          unit: line.unit.trim() || "kg",
        }
        if (itemTypeRequiresDimensions(line.item_type)) {
          payload.micras = line.micras.trim() || null
          payload.ancho_mm = line.ancho_mm.trim() || null
        }
        return payload
      })

    return {
      purchase_order_id: Number(form.purchase_order_id),
      without_purchase_order: false,
      supplier_id: Number(form.supplier_id),
      supplier_name: form.supplier_name.trim() || null,
      invoice_number: form.invoice_number.trim() || null,
      purchase_order_reference: form.purchase_order_reference.trim() || null,
      notes: form.notes.trim() || null,
      received_at: form.received_at || null,
      lines,
    }
  }

  async function submit(): Promise<boolean> {
    if (!validate()) return false

    setSaving(true)
    setFieldErrors({})
    try {
      const payload = toPayload()
      const dup = await checkDuplicateReceipts({
        supplier_id: payload.supplier_id,
        invoice_number: payload.invoice_number ?? undefined,
        purchase_order_reference: payload.purchase_order_reference ?? undefined,
      })
      if (dup.has_duplicates) {
        toast.error(PURCHASE_RECEIPT_LABELS.duplicateWarning)
        return false
      }
      await createPurchaseReceipt(payload)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : PURCHASE_RECEIPT_LABELS.saveError
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
    pendingOrders,
    materials,
    loadingOrders,
    loadingPo,
    saving,
    fieldErrors,
    submit,
    loadPurchaseOrder,
  }
}
