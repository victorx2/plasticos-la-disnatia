export const MATERIAL_CATEGORIES = [
  { value: "resina", label: "Resina" },
  { value: "pigmento", label: "Pigmento" },
  { value: "miscelaneo", label: "Misceláneo" },
  { value: "deslizante", label: "Deslizante" },
  { value: "core", label: "Core" },
] as const

export type MaterialCategoryValue = (typeof MATERIAL_CATEGORIES)[number]["value"]

export type MaterialCategoryTab = "all" | MaterialCategoryValue

export const LIST_CATEGORY_TABS: Array<{ id: MaterialCategoryTab; label: string }> = [
  { id: "all", label: "Todos" },
  ...MATERIAL_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
]

const CATEGORY_LABELS = new Map<string, string>(
  MATERIAL_CATEGORIES.map((c) => [c.value, c.label]),
)

export function categoryLabel(value: string): string {
  return CATEGORY_LABELS.get(value) ?? value
}

export function isValidCategory(value: string): value is MaterialCategoryValue {
  return CATEGORY_LABELS.has(value)
}

const CATEGORY_ALIASES: Record<string, MaterialCategoryValue> = {
  resina: "resina",
  pigmento: "pigmento",
  miscelaneo: "miscelaneo",
  misceláneo: "miscelaneo",
  miscelaneos: "miscelaneo",
  misceláneos: "miscelaneo",
  deslizante: "deslizante",
  core: "core",
  cores: "core",
}

export function normalizeCategoryValue(raw: string): MaterialCategoryValue | null {
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  return CATEGORY_ALIASES[key] ?? null
}

export const DEFAULT_CATEGORY: MaterialCategoryValue = "resina"
