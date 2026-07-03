export const INVENTORY_EXCEL_COLUMNS = [
  "Fecha",
  "Categoría",
  "Tipo",
  "Marca",
  "Cantidad_kg",
  "Unidades_sacos",
  "Proveedor",
  "Nro_contenedor",
] as const

export const TEMPLATE_URLS = {
  inventarioInicial: "/templates/inventario-inicial.csv",
  entradaProducto: "/templates/entrada-producto.csv",
} as const
