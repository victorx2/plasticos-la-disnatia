import type { MaterialRequestDetail } from "@/features/material-requests/types"

const OPEN_REQUEST_STATUSES = new Set(["pending", "authorized", "partial"])

export function materialRequestPendingKg(
  line: { quantity_requested: string | number; quantity_dispatched?: string | number | null },
): number {
  const requested = Number(line.quantity_requested ?? 0)
  const dispatched = Number(line.quantity_dispatched ?? 0)
  if (!Number.isFinite(requested) || !Number.isFinite(dispatched)) return 0
  return Math.max(0, requested - dispatched)
}

export function materialRequestHasPendingDispatch(request: MaterialRequestDetail): boolean {
  if (!OPEN_REQUEST_STATUSES.has(request.status)) return false
  return (request.lines ?? []).some((line) => materialRequestPendingKg(line) > 0.0001)
}

export function areaRequestInsumosHref(materialRequestId: number): string {
  return `/solicitudes-area/insumos/${materialRequestId}`
}
