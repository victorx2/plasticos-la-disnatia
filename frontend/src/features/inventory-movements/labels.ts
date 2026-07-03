export const INVENTORY_MOVEMENT_LABELS = {
  listTitle: "Movimientos de inventario",
  listSubtitle: "Historial de entradas, salidas y ajustes de stock.",
  searchLabel: "Buscar material",
  searchPlaceholder: "SKU o nombre del material…",
  emptyTitle: "Sin movimientos",
  emptyDescription: "No hay movimientos en el rango y filtros seleccionados.",
  loadError: "No se pudo cargar el historial de movimientos.",
  fields: {
    date: "Fecha",
    type: "Tipo",
    material: "Material",
    area: "Área",
    quantity: "Cantidad",
    user: "Usuario",
    reference: "Referencia",
    reason: "Motivo",
  },
  filters: {
    from: "Desde",
    to: "Hasta",
    movementType: "Tipo de movimiento",
    inventoryArea: "Área de inventario",
    referenceType: "Tipo de referencia",
  },
  table: {
    number: "N.º",
  },
  count: (n: number) =>
    n === 1 ? "1 movimiento" : `${n.toLocaleString("es-VE")} movimientos`,
} as const
