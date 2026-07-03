export const PURCHASE_ORDER_STATUS_LABELS: Record<string, string> = {
  open: "Abierta",
  partial: "Parcial",
  completed: "Completada",
  cancelled: "Completada",
}

export function purchaseOrderStatusLabel(status: string | null | undefined): string {
  if (!status) return "—"
  return PURCHASE_ORDER_STATUS_LABELS[status] ?? status
}
