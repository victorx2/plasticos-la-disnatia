export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  in: "Entrada",
  out: "Salida",
  adjustment_add: "Ajuste +",
  adjustment_sub: "Ajuste −",
}

export const REFERENCE_TYPE_LABELS: Record<string, string> = {
  purchase_receipt: "Recepción",
  miscellaneous_receipt: "Ingreso misceláneo",
  material_request: "Despacho / solicitud",
  material_request_bobina: "Despacho (bobina)",
  inventory_return: "Devolución",
  inventory_adjustment: "Ajuste",
}

export const MOVEMENT_TYPE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "in", label: "Entrada" },
  { value: "out", label: "Salida" },
  { value: "adjustment_add", label: "Ajuste +" },
  { value: "adjustment_sub", label: "Ajuste −" },
] as const

export const REFERENCE_TYPE_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "purchase_receipt", label: "Recepción" },
  { value: "material_request", label: "Despacho / solicitud" },
  { value: "inventory_return", label: "Devolución" },
  { value: "inventory_adjustment", label: "Ajuste" },
] as const

export function defaultFromDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().slice(0, 10)
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}
