import { BOLSONES_LABELS } from "@/features/production-subproducts/labels"
import { orderLabel } from "@/features/production-subproducts/lib/orderLabel"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

type InventoryRowLike = {
  entry_kind?: string
  description?: string | null
  measure?: string | null
  client_order_code?: string | null
  work_order_code?: string | null
  work_order_id?: number | null
  production_kg?: string | null
  manual_kg?: string | null
  refil_kg?: string | null
  transparente_kg?: string | null
}

export function inventoryOrderLabel(item: InventoryRowLike): string {
  if (item.entry_kind === "stock") {
    return item.measure?.trim() || "—"
  }
  if (item.entry_kind === "manual") {
    return item.description?.trim() || "Entrada manual"
  }
  return orderLabel(item.client_order_code, item.work_order_code, item.work_order_id ?? undefined)
}

export function inventoryClientLabel(item: InventoryRowLike): string | null {
  if (item.entry_kind === "stock") {
    return bolsonesSourceDetail(item.production_kg, item.manual_kg)
  }
  if (item.entry_kind === "manual") {
    return BOLSONES_LABELS.entryKindManual
  }
  return null
}

export function bolsonesSourceDetail(productionKg?: string | null, manualKg?: string | null): string | null {
  const production = parseKgNumber(productionKg)
  const manual = parseKgNumber(manualKg)
  const parts: string[] = []
  if (production > 0) {
    parts.push(`${BOLSONES_LABELS.sourceProduction}: ${formatKgDisplay(productionKg)}`)
  }
  if (manual > 0) {
    parts.push(`${BOLSONES_LABELS.sourceManual}: ${formatKgDisplay(manualKg)}`)
  }
  return parts.length ? parts.join(" · ") : null
}

export function desperdicioSourceDetail(item: InventoryRowLike): string | null {
  if (item.entry_kind === "manual") {
    return BOLSONES_LABELS.entryKindManual
  }
  const refil = parseKgNumber(item.refil_kg)
  const transparente = parseKgNumber(item.transparente_kg)
  if (refil <= 0 && transparente <= 0) return null
  return `Refil: ${formatKgDisplay(item.refil_kg)} · Transparente: ${formatKgDisplay(item.transparente_kg)}`
}
