export const AREA_OPTIONS = [
  { value: "almacen", label: "Almacén" },
  { value: "mezcla", label: "Mezcla" },
  { value: "extrusion", label: "Extrusión" },
  { value: "produccion", label: "Producción" },
] as const

export const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendiente" },
  { value: "done", label: "Completada" },
  { value: "cancelled", label: "Cancelada" },
] as const

export function areaLabel(code: string): string {
  return AREA_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export function areaRequestStatusLabel(code: string): string {
  return STATUS_OPTIONS.find((o) => o.value === code)?.label ?? code
}
