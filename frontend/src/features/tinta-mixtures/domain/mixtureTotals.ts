import type { TintaMixture, TintaMixtureComponent } from "@/features/tinta-mixtures/types"

export function sumComponentQuantities(components: { quantity: string }[]): number | null {
  let total = 0
  let hasValue = false
  for (const row of components) {
    const trimmed = row.quantity.trim().replace(",", ".")
    if (!trimmed) continue
    const n = Number(trimmed)
    if (Number.isFinite(n)) {
      total += n
      hasValue = true
    }
  }
  return hasValue ? total : null
}

export function formatMixtureTotalKg(total: number | null, unit = "kg"): string {
  if (total == null) return "—"
  return `${total.toLocaleString("es-VE")} ${unit}`
}

export function mixtureTotalKg(mixture: Pick<TintaMixture, "components" | "unit">): string {
  const comps = mixture.components ?? []
  if (!comps.length) return "—"
  const total = sumComponentQuantities(
    comps.map((c: TintaMixtureComponent) => ({ quantity: String(c.quantity) })),
  )
  return formatMixtureTotalKg(total, mixture.unit ?? "kg")
}
