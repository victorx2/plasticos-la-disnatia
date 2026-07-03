import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import {
  createInventoryReturnsBatch,
  fetchReturnableProducts,
} from "@/features/inventory-returns/api"
import { INVENTORY_RETURN_LABELS } from "@/features/inventory-returns/labels"
import type { ReturnableProduct } from "@/features/inventory-returns/types"
import { ApiError } from "@/shared/api/client"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

export type ReturnProductLineForm = {
  key: string
  product_key: string
  quantity_units: string
}

let lineKeySeq = 0

function newLineKey(): string {
  lineKeySeq += 1
  return `ret-line-${lineKeySeq}`
}

export function emptyReturnProductLine(): ReturnProductLineForm {
  return {
    key: newLineKey(),
    product_key: "",
    quantity_units: "1",
  }
}

export type ReturnRoute = "fallas" | "rejected" | "tintas"

export type InventoryReturnFormInitial = {
  workOrderId?: string
  reason?: string
  returnRoute?: ReturnRoute
}

export function useInventoryReturnForm(initial?: InventoryReturnFormInitial) {
  const [workOrderId, setWorkOrderId] = useState(initial?.workOrderId ?? "")
  const [returnRoute, setReturnRoute] = useState<ReturnRoute>(initial?.returnRoute ?? "fallas")
  const [reason, setReason] = useState(initial?.reason ?? "")
  const [lines, setLines] = useState<ReturnProductLineForm[]>([emptyReturnProductLine()])
  const [products, setProducts] = useState<ReturnableProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const productByKey = useMemo(() => {
    const map = new Map<string, ReturnableProduct>()
    for (const item of products) {
      map.set(item.key, item)
    }
    return map
  }, [products])

  const loadProducts = useCallback(async (workId: number) => {
    setLoadingProducts(true)
    try {
      const rows = await fetchReturnableProducts(workId)
      setProducts(rows)
    } catch (error) {
      setProducts([])
      const message =
        error instanceof ApiError ? error.message : INVENTORY_RETURN_LABELS.loadProductsError
      toast.error(message)
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    const workId = Number(workOrderId)
    if (!workOrderId || !Number.isFinite(workId) || workId <= 0) {
      setProducts([])
      return
    }
    void loadProducts(workId)
  }, [workOrderId, loadProducts])

  useEffect(() => {
    if (!initial) return
    if (initial.workOrderId) setWorkOrderId(initial.workOrderId)
    if (initial.reason) setReason(initial.reason)
    if (initial.returnRoute) setReturnRoute(initial.returnRoute)
  }, [initial])

  function lineMeta(line: ReturnProductLineForm) {
    const product = line.product_key ? productByKey.get(line.product_key) : undefined
    const units = Math.max(1, Number.parseInt(line.quantity_units, 10) || 1)
    const kgPer = product ? parseKgNumber(product.kg_per_unit) : 0
    return {
      product,
      units,
      shift: product?.shift ?? null,
      kg: product ? kgPer * units : 0,
      maxUnits: product?.max_units ?? 1,
    }
  }

  const totalKg = useMemo(
    () => lines.reduce((sum, line) => sum + lineMeta(line).kg, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lineMeta reads stable productByKey
    [lines, productByKey],
  )

  function addLine() {
    setLines((prev) => [...prev, emptyReturnProductLine()])
  }

  function removeLine(lineKey: string) {
    setLines((prev) => {
      const next = prev.filter((line) => line.key !== lineKey)
      return next.length ? next : [emptyReturnProductLine()]
    })
  }

  function updateLine(lineKey: string, patch: Partial<ReturnProductLineForm>) {
    setLines((prev) =>
      prev.map((line) => (line.key === lineKey ? { ...line, ...patch } : line)),
    )
  }

  async function submit(): Promise<boolean> {
    const workId = Number(workOrderId)
    if (!workOrderId || !Number.isFinite(workId) || workId <= 0) {
      setFieldErrors({ work_order_id: INVENTORY_RETURN_LABELS.errors.workOrderRequired })
      return false
    }

    const validLines = lines.filter((line) => line.product_key.trim())
    if (!validLines.length) {
      toast.error(INVENTORY_RETURN_LABELS.errors.linesRequired)
      return false
    }

    for (const line of validLines) {
      const { product, units, maxUnits } = lineMeta(line)
      if (!product) {
        toast.error(INVENTORY_RETURN_LABELS.errors.invalidProduct)
        return false
      }
      if (units < 1 || units > maxUnits) {
        toast.error(INVENTORY_RETURN_LABELS.errors.invalidQuantity(maxUnits))
        return false
      }
    }

    const usedBobinas = new Set<string>()
    for (const line of validLines) {
      if (line.product_key.startsWith("bobina:") && usedBobinas.has(line.product_key)) {
        toast.error(INVENTORY_RETURN_LABELS.errors.duplicateBobina)
        return false
      }
      usedBobinas.add(line.product_key)
    }

    setSaving(true)
    setFieldErrors({})
    try {
      await createInventoryReturnsBatch({
        work_order_id: workId,
        reason: reason.trim() || null,
        return_route: returnRoute,
        lines: validLines.map((line) => ({
          product_key: line.product_key,
          quantity_units: Number.parseInt(line.quantity_units, 10) || 1,
        })),
      })
      toast.success(INVENTORY_RETURN_LABELS.saveSuccess)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.body.errors) {
        const next: Record<string, string> = {}
        for (const [key, messages] of Object.entries(error.body.errors)) {
          if (messages[0]) next[key] = messages[0]
        }
        setFieldErrors(next)
      }
      const message = error instanceof ApiError ? error.message : INVENTORY_RETURN_LABELS.saveError
      toast.error(message)
      return false
    } finally {
      setSaving(false)
    }
  }

  return {
    workOrderId,
    setWorkOrderId,
    returnRoute,
    setReturnRoute,
    reason,
    setReason,
    lines,
    products,
    loadingProducts,
    productByKey,
    lineMeta,
    totalKg,
    addLine,
    removeLine,
    updateLine,
    saving,
    fieldErrors,
    submit,
    formatLineKg: (line: ReturnProductLineForm) => formatKgDisplay(lineMeta(line).kg),
  }
}
