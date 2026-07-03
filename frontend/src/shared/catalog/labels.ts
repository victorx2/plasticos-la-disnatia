export const CATALOG_LABELS = {
  searchHint: "Búsqueda automática al escribir · Enter fuerza la búsqueda inmediata",
  loading: "Cargando…",
  perPage: "Por página",
  previous: "Anterior",
  next: "Siguiente",
  pageOf: (current: number, last: number) => `Página ${current} de ${last}`,
  pageSlash: (current: number, last: number) => `${current} / ${last}`,
  showingRange: (from: number, to: number, total: number) =>
    `Mostrando ${from} a ${to} de ${total}`,
  showingRangeBold: (from: number, to: number, total: number) =>
    `Mostrando ${from} a ${to} de ${total} registros`,
} as const
