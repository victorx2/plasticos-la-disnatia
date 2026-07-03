import type { MaterialRequestLine } from "@/features/material-requests/types"
import type { MixtureComponentForm } from "@/features/tinta-mixtures/hooks/useTintaMixtureForm"

function newRowKey(): string {
  return `comp-${crypto.randomUUID()}`
}

function parseQuantityKg(raw: string): number {
  const trimmed = raw.trim().replace(",", ".")
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : 0
}

/** Lee kg totales desde observaciones de solicitud (ej. "500 kg", "500,5"). */
export function parseKgFromObservations(notes: string | null | undefined): number | null {
  const trimmed = notes?.trim()
  if (!trimmed) return null
  const match = trimmed.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  let numStr = match[1]
  if (numStr.includes(",") && numStr.includes(".")) {
    numStr = numStr.replace(/\./g, "").replace(",", ".")
  } else if (numStr.includes(",")) {
    numStr = numStr.replace(",", ".")
  }
  const n = Number(numStr)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function scaleComponentsToTargetKg(
  components: MixtureComponentForm[],
  targetKg: number,
): MixtureComponentForm[] {
  const currentTotal = components.reduce((sum, row) => sum + parseQuantityKg(row.quantity), 0)
  if (currentTotal <= 0 || Math.abs(currentTotal - targetKg) < 0.001) {
    return components
  }
  const factor = targetKg / currentTotal
  return components.map((row) => {
    const q = parseQuantityKg(row.quantity)
    if (q <= 0) return row
    const scaled = Math.round(q * factor * 1000) / 1000
    return { ...row, quantity: String(scaled) }
  })
}

export function emptyMixtureComponents(count = 2): MixtureComponentForm[] {
  return Array.from({ length: count }, () => ({
    key: newRowKey(),
    material_id: "",
    quantity: "",
  }))
}

export function componentsFromMaterialRequestLines(
  lines: MaterialRequestLine[],
): MixtureComponentForm[] {
  const usable = lines.filter(
    (line) => line.material_id && String(line.quantity_requested ?? "").trim(),
  )
  if (usable.length >= 2) {
    return usable.map((line) => ({
      key: newRowKey(),
      material_id: String(line.material_id),
      quantity: String(line.quantity_requested),
    }))
  }
  return emptyMixtureComponents()
}

export function formatOrderQuantity(
  quantity: string | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (!quantity?.trim()) return null
  const qty = quantity.trim()
  const u = (unit ?? "kg").trim() || "kg"
  return `${Number(qty).toLocaleString("es-VE")} ${u}`
}

export function orderTargetKg(
  quantity: string | null | undefined,
  unit: string | null | undefined,
): number | null {
  if (!quantity?.trim()) return null
  const u = (unit ?? "kg").trim().toLowerCase()
  if (u !== "kg") return null
  const n = Number(quantity.trim().replace(",", "."))
  return Number.isFinite(n) ? n : null
}
