export function parseKgNumber(raw?: string | null): number {
  const n = Number.parseFloat(String(raw ?? "0").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}

export function formatKgDisplay(raw?: string | number | null): string {
  const n =
    typeof raw === "number"
      ? raw
      : Number.parseFloat(String(raw ?? "0").replace(",", "."))
  if (!Number.isFinite(n)) return "0 kg"
  return `${n.toLocaleString("es-VE", { minimumFractionDigits: 0, maximumFractionDigits: 3 })} kg`
}

export function formatCount(value: number): string {
  return value.toLocaleString("es-VE")
}

/** Minutos totales → "25 min" o "1h 25m" (mismo criterio que extrusión). */
export function formatDurationMinutes(raw?: string | number | null): string {
  const n = parseMinutesNumber(raw)
  if (n <= 0) return "—"
  const h = Math.floor(n / 60)
  const m = Math.round(n % 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

export function parseMinutesNumber(raw?: string | number | null): number {
  const n =
    typeof raw === "number"
      ? raw
      : Number.parseFloat(String(raw ?? "0").replace(",", "."))
  return Number.isFinite(n) ? n : 0
}
