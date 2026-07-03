export function orderLabel(
  clientOrderCode?: string | null,
  workOrderCode?: string | null,
  workOrderId?: number,
) {
  return clientOrderCode ?? workOrderCode ?? (workOrderId ? `#${workOrderId}` : "—")
}
