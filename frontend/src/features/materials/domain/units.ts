export const KG_PER_SACO = 25
export const DEFAULT_UNIT = "kg"

export function sacosFromKg(kg: string | number | null | undefined): number | null {
  const n = Number(String(kg ?? "").replace(",", "."))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round((n / KG_PER_SACO) * 1000) / 1000
}

export function kgFromSacos(sacos: string | number | null | undefined): number | null {
  const n = Number(String(sacos ?? "").replace(",", "."))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * KG_PER_SACO * 1000) / 1000
}

export function formatKg(value: string | number | null | undefined): string {
  const n = Number(String(value ?? "0").replace(",", "."))
  if (!Number.isFinite(n)) return "0"
  return n.toLocaleString("es-VE", { maximumFractionDigits: 3 })
}
