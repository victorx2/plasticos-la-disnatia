import { MATERIAL_CATEGORIES } from "@/features/materials/domain/categories"

/** Legacy warehouse areas that can be used as mixture inputs. */
const LEGACY_MIXTURE_AREAS = new Set(["material", "materia_prima", "quimicos"])

/** Acarigua master-data categories (resina, pigmento, etc.). */
const ACARIGUA_MIXTURE_AREAS = new Set<string>(MATERIAL_CATEGORIES.map((c) => c.value))

/** Finished-goods or non-MP areas excluded from mixture component pickers. */
const EXCLUDED_MIXTURE_AREAS = new Set(["bobinas_rechazadas", "miscelaneos"])

export function isMixtureComponentMaterial(inventoryArea: string): boolean {
  if (EXCLUDED_MIXTURE_AREAS.has(inventoryArea)) return false
  return LEGACY_MIXTURE_AREAS.has(inventoryArea) || ACARIGUA_MIXTURE_AREAS.has(inventoryArea)
}
