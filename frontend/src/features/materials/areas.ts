import { categoryLabel } from "@/features/materials/domain/categories"
import type { InventoryAreaValue, TintaSubareaValue } from "@/features/materials/types"

export const INVENTORY_AREAS: Array<{ value: InventoryAreaValue; label: string }> = [
  { value: "material", label: "Sustrato" },
  { value: "tintas", label: "Tintas" },
  { value: "cementerio_tintas", label: "Cementerio tintas" },
  { value: "quimicos", label: "Químicos" },
  { value: "bobinas_rechazadas", label: "Bobinas rechazadas" },
  { value: "fallas", label: "Fallas" },
  { value: "miscelaneos", label: "Misceláneos" },
]

export const LIST_AREA_TABS: Array<{ id: "all" | InventoryAreaValue; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "material", label: "Sustrato" },
  { id: "tintas", label: "Tintas" },
  { id: "quimicos", label: "Químicos" },
  { id: "miscelaneos", label: "Misceláneos" },
]

export const TINTA_SUBAREAS: Array<{ value: TintaSubareaValue; label: string }> = [
  { value: "laminacion", label: "Laminación" },
  { value: "superficie", label: "Superficie" },
  { value: "prueba_laminacion", label: "Prueba laminación" },
  { value: "laminacion_nueva", label: "Laminación nueva" },
]

const SUPPLIER_AREAS = new Set([
  "material",
  "tintas",
  "cementerio_tintas",
  "quimicos",
  "miscelaneos",
])

const TINTA_AREAS = new Set(["tintas", "cementerio_tintas"])

export function inventoryAreaLabel(area: string): string {
  const legacy = INVENTORY_AREAS.find((a) => a.value === area)?.label
  if (legacy) return legacy
  const acarigua = categoryLabel(area)
  if (acarigua !== area) return acarigua
  return area
}

export function areaRequiresSupplier(area: string): boolean {
  return SUPPLIER_AREAS.has(area)
}

export function areaRequiresTintaSubarea(area: string): boolean {
  return TINTA_AREAS.has(area)
}

export function areaShowsDimensions(area: string): boolean {
  return area === "material"
}

export function unitsForArea(area: string): string[] {
  switch (area) {
    case "material":
    case "bobinas_rechazadas":
      return ["kg", "m", "rollo"]
    case "miscelaneos":
      return ["kg", "unidad", "m", "rollo", "otros"]
    case "tintas":
    case "cementerio_tintas":
    case "quimicos":
      return ["kg", "unidad"]
    default:
      return ["kg", "unidad"]
  }
}

export function defaultUnitForArea(area: string): string {
  return unitsForArea(area)[0] ?? "kg"
}
