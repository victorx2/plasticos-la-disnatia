import type { ReceiptItemTypeApi } from "@/features/purchase-receipts/types"

export function itemTypeFromInventoryArea(area: string): ReceiptItemTypeApi {
  const normalized = area.trim().toLowerCase()
  if (normalized === "tintas" || normalized === "cementerio_tintas") return "tinta"
  if (normalized === "quimicos") return "quimico"
  if (normalized === "miscelaneos") return "miscelaneo"
  return "sustrato"
}

export function itemTypeRequiresDimensions(itemType: ReceiptItemTypeApi): boolean {
  return itemType === "sustrato"
}

export function allowedUnitsForItemType(itemType: ReceiptItemTypeApi): string[] {
  if (itemType === "tinta" || itemType === "quimico") return ["kg", "unidad"]
  if (itemType === "miscelaneo") return ["kg", "unidad", "otros"]
  return ["kg", "unidad", "m", "rollo"]
}

export function itemTypeLabel(itemType: ReceiptItemTypeApi): string {
  switch (itemType) {
    case "tinta":
      return "Tinta"
    case "quimico":
      return "Químico"
    case "miscelaneo":
      return "Misceláneo"
    case "consumible":
      return "Consumible"
    default:
      return "Sustrato"
  }
}

export function polRemainingQty(
  ordered: string | number | null | undefined,
  received: string | number | null | undefined,
): number {
  const o = Number(ordered ?? 0)
  const r = Number(received ?? 0)
  if (!Number.isFinite(o) || !Number.isFinite(r)) return 0
  return Math.max(0, o - r)
}
