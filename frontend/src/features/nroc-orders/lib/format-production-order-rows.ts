import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrder } from "@/features/nroc-orders/types"

export function formatProductionOrderProduct(order: NrocOrder): string {
  const count = order.lines_count ?? 0
  if (count > 1) return PRODUCTION_ORDER_LABELS.linesCount(count)
  return order.first_line_with_product?.product?.name ?? "—"
}

export function formatProductionOrderQuantity(order: NrocOrder): string {
  const line = order.first_line_with_product
  if (!line) return "—"
  if ((order.lines_count ?? 0) > 1) {
    const qty = line.quantity?.trim()
    const unit = line.unit?.trim()
    const base = qty && unit ? `${qty} ${unit}` : qty ?? "—"
    return `${base} (+ más)`
  }
  const qty = line.quantity?.trim()
  const unit = line.unit?.trim()
  if (!qty) return "—"
  return unit ? `${qty} ${unit}` : qty
}
