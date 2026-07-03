import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { createNrocOrder, fetchNrocOrder, updateNrocOrder } from "@/features/nroc-orders/api"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrderLineInput } from "@/features/nroc-orders/types"
import { fetchProducts } from "@/features/masters/products/api"
import type { Product } from "@/features/masters/products/types"
import type { Client } from "@/features/masters/clients/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { ApiError } from "@/shared/api/client"

export type LineDraft = {
  key: string
  product_id: string
  quantity: string
  unit: string
  description: string
}

function normalizeUnit(raw: string | null | undefined): string {
  return raw?.trim().toLowerCase() || "kg"
}

function newLine(): LineDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    product_id: "",
    quantity: "",
    unit: "kg",
    description: "",
  }
}

function todayLocalDateInput(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parsePositiveQuantity(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".")
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

function lineFromApi(line: {
  product_id?: number | null
  quantity?: string
  unit?: string | null
  description?: string | null
  id?: number
}): LineDraft {
  return {
    key: `line-${line.id ?? Math.random()}`,
    product_id: line.product_id ? String(line.product_id) : "",
    quantity: line.quantity?.trim() ?? "",
    unit: normalizeUnit(line.unit),
    description: line.description ?? "",
  }
}

export function useNrocOrderForm(
  orderId: number | null,
  clients: Client[] = [],
  batchId: number | null = null,
  options?: {
    initialClientId?: string | null
    initialProductId?: string | null
  },
) {
  const [loading, setLoading] = useState(Boolean(orderId))
  const [saving, setSaving] = useState(false)
  const [clientId, setClientId] = useState("")
  const [saleFor, setSaleFor] = useState("")
  const [orderedAt, setOrderedAt] = useState(todayLocalDateInput())
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("open")
  const [lines, setLines] = useState<LineDraft[]>([newLine()])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [readOnly, setReadOnly] = useState(false)
  const [batchCode, setBatchCode] = useState<string | null>(null)

  const selectedClient = useMemo(
    () => clients.find((c) => String(c.id) === clientId) ?? null,
    [clients, clientId],
  )

  const allowedProductIds = useMemo(
    () => new Set(products.map((p) => String(p.id))),
    [products],
  )

  useEffect(() => {
    const cid = Number(clientId)
    if (!Number.isFinite(cid) || cid <= 0) {
      setProducts([])
      return
    }
    let cancelled = false
    setLoadingProducts(true)
    void (async () => {
      try {
        const data = await fetchAllPages(fetchProducts, { client_id: cid })
        if (!cancelled) setProducts(data)
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoadingProducts(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [clientId])

  useEffect(() => {
    if (orderId || !options?.initialClientId) return
    const cid = options.initialClientId.trim()
    if (!cid) return
    setClientId(cid)
  }, [orderId, options?.initialClientId])

  useEffect(() => {
    if (orderId || !options?.initialProductId || !clientId || loadingProducts) return
    const pid = options.initialProductId.trim()
    if (!pid || !products.some((p) => String(p.id) === pid)) return

    setLines((prev) => {
      const existing = prev.find((line) => line.product_id === pid)
      if (existing) return prev
      const emptyLine = prev.find((line) => !line.product_id.trim())
      if (emptyLine) {
        return prev.map((line) =>
          line.key === emptyLine.key ? { ...line, product_id: pid } : line,
        )
      }
      return [...prev, { ...newLine(), product_id: pid }]
    })
  }, [orderId, options?.initialProductId, clientId, loadingProducts, products])

  useEffect(() => {
    if (!batchId || orderId) return
    let cancelled = false
    void (async () => {
      try {
        const { fetchProductionBatch } = await import("@/features/nroc-orders/api")
        const batch = await fetchProductionBatch(batchId)
        if (!cancelled) setBatchCode(batch.code)
      } catch {
        if (!cancelled) setBatchCode(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [batchId, orderId])

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const order = await fetchNrocOrder(orderId)
        if (cancelled) return
        setClientId(String(order.client_id))
        setSaleFor(order.sale_for ?? "")
        setOrderedAt(order.ordered_at?.slice(0, 10) ?? todayLocalDateInput())
        setNotes(order.notes ?? "")
        setStatus(order.status)
        setReadOnly(order.status !== "open")
        const loaded = order.lines?.map(lineFromApi) ?? []
        setLines(loaded.length > 0 ? loaded : [newLine()])
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : PRODUCTION_ORDER_LABELS.loadOneError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, newLine()])
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }, [])

  const updateLine = useCallback((key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }, [])

  function buildPayload(): { ok: true; body: Parameters<typeof createNrocOrder>[0] } | { ok: false } {
    const errors: Record<string, string> = {}
    const cid = Number(clientId)
    if (!Number.isFinite(cid) || cid <= 0) {
      errors.client_id = PRODUCTION_ORDER_LABELS.validation.client
    }

    const payloadLines: NrocOrderLineInput[] = []
    for (const row of lines) {
      const pid = row.product_id.trim()
      if (!pid) continue

      const quantity = parsePositiveQuantity(row.quantity)
      if (quantity === null) {
        errors[`line-${row.key}-quantity`] = PRODUCTION_ORDER_LABELS.validation.quantity
        continue
      }

      if (!allowedProductIds.has(pid)) {
        errors[`line-${row.key}-product`] = PRODUCTION_ORDER_LABELS.validation.productClient
        continue
      }

      payloadLines.push({
        product_id: Number(pid),
        quantity,
        unit: row.unit.trim() || "kg",
        description: row.description.trim() || undefined,
      })
    }

    if (payloadLines.length === 0) {
      errors.lines = PRODUCTION_ORDER_LABELS.validation.lines
    }

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return { ok: false }

    return {
      ok: true,
      body: {
        client_id: cid,
        ordered_at: orderedAt || undefined,
        sale_for: saleFor.trim() || null,
        notes: notes.trim() || undefined,
        lines: payloadLines,
        ...(orderId ? { status } : {}),
      },
    }
  }

  async function submit(): Promise<boolean> {
    if (readOnly) {
      toast.error(PRODUCTION_ORDER_LABELS.validation.onlyOpen)
      return false
    }
    const built = buildPayload()
    if (!built.ok) return false

    setSaving(true)
    try {
      if (orderId) {
        await updateNrocOrder(orderId, built.body)
        toast.success(PRODUCTION_ORDER_LABELS.saved)
      } else {
        await createNrocOrder({
          ...built.body,
          ...(batchId ? { batch_id: batchId } : {}),
        })
        toast.success(
          batchId
            ? PRODUCTION_ORDER_LABELS.saved
            : PRODUCTION_ORDER_LABELS.savedGoProgramacion,
          batchId
            ? undefined
            : {
                action: {
                  label: PRODUCTION_ORDER_LABELS.goToProgramacion,
                  onClick: () => {
                    window.location.href = "/programacion"
                  },
                },
              },
        )
      }
      return true
    } catch (error) {
      const message = error instanceof ApiError ? error.message : PRODUCTION_ORDER_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    loading,
    saving,
    clientId,
    setClientId,
    selectedClient,
    saleFor,
    setSaleFor,
    orderedAt,
    setOrderedAt,
    notes,
    setNotes,
    status,
    setStatus,
    lines,
    addLine,
    removeLine,
    updateLine,
    products,
    loadingProducts,
    fieldErrors,
    readOnly,
    submit,
    isEdit: Boolean(orderId),
    batchId,
    batchCode,
  }
}
