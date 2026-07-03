import type { MaterialRequestLineInput } from "@/features/material-requests/types"
import { fetchPrincipalBalance, fetchTintaMixtures } from "@/features/tinta-mixtures/api"
import type { TintaMixture } from "@/features/tinta-mixtures/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { parseKgNumber } from "@/shared/format/numbers"

export type MixtureMaterialTotal = {
  material_id: number
  description: string
  quantity_requested: string
  unit: string
}

function lineDescription(material?: { sku: string; name: string } | null): string {
  if (!material) return "Material de mezcla"
  return `${material.sku} · ${material.name}`
}

function aggregateComponents(mixtures: TintaMixture[]): MixtureMaterialTotal[] {
  const totals = new Map<number, { qty: number; description: string; unit: string }>()

  for (const mixture of mixtures) {
    for (const component of mixture.components ?? []) {
      const materialId = component.material_id
      const add = parseKgNumber(String(component.quantity))
      if (add <= 0) continue
      const desc = lineDescription(component.material ?? null)
      const existing = totals.get(materialId)
      if (existing) {
        existing.qty += add
      } else {
        totals.set(materialId, { qty: add, description: desc, unit: "kg" })
      }
    }
  }

  return [...totals.entries()].map(([material_id, row]) => ({
    material_id,
    description: row.description,
    quantity_requested: String(row.qty),
    unit: row.unit,
  }))
}

/** Receta original (primera solicitud) del trabajo — para reposición. */
export async function fetchPrincipalInitialMaterials(
  workOrderId: number,
): Promise<MixtureMaterialTotal[]> {
  const balance = await fetchPrincipalBalance(workOrderId)
  const rows = balance?.initial_components ?? []
  if (!rows.length) return []

  return rows
    .filter((row) => parseKgNumber(row.quantity) > 0)
    .map((row) => ({
      material_id: row.material_id,
      description: lineDescription(row.material ?? null),
      quantity_requested: row.quantity,
      unit: row.material?.unit ?? "kg",
    }))
}

/** Saldo restante en la mezcla principal (cupo por material). */
export async function fetchPrincipalRemainingMaterials(
  workOrderId: number,
): Promise<MixtureMaterialTotal[]> {
  const balance = await fetchPrincipalBalance(workOrderId)
  if (!balance?.components.length) return []

  return balance.components
    .filter((row) => parseKgNumber(row.quantity) > 0)
    .map((row) => ({
      material_id: row.material_id,
      description: lineDescription(row.material ?? null),
      quantity_requested: row.quantity,
      unit: row.material?.unit ?? "kg",
    }))
}

export async function fetchMixtureMaterialTotals(
  workOrderId: number,
): Promise<MixtureMaterialTotal[]> {
  const remaining = await fetchPrincipalRemainingMaterials(workOrderId)
  if (remaining.length) return remaining

  const mixtures = await fetchAllPages(fetchTintaMixtures, {
    work_order_id: workOrderId,
    mixture_kind: "mezcla",
  })
  return aggregateComponents(mixtures)
}

export function mixtureTotalsToRequestLines(
  totals: MixtureMaterialTotal[],
): MaterialRequestLineInput[] {
  return totals.map((row) => ({
    material_id: row.material_id,
    description: row.description,
    quantity_requested: row.quantity_requested,
    unit: row.unit,
  }))
}

export function sumKgFromRequestLines(
  lines: Array<{ quantity_requested: string; unit: string }>,
): number {
  return lines.reduce((sum, line) => {
    const unit = (line.unit ?? "kg").toLowerCase()
    if (unit !== "kg") return sum
    return sum + parseKgNumber(line.quantity_requested)
  }, 0)
}
