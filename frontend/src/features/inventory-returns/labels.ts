import { inventoryAreaLabel } from "@/features/materials/areas"

export const INVENTORY_RETURN_LABELS = {
  listTitle: "Devoluciones a inventario",
  listSubtitle: "Buenas reingresan a sustrato; malas y mezclas quedan pendientes hasta verificar.",
  formTitle: "Registrar devolución",
  formSubtitle: "Seleccione la OP y los productos que regresan a almacén.",
  helpFlow:
    "Elija el trabajo en planta (OP). Agregue productos con +; al seleccionar cada ítem verá turno y kg automáticamente.",
  sections: {
    workOrder: "Orden de producción (OP)",
    workOrderHint: "Trabajo en planta al que pertenece lo que devuelve.",
    route: "Verificación / destino",
    routeHint: "Fallas: verificar antes de reciclar en materiales. Rechazada: bobinas malas. Mezcla: tintas.",
    products: "Productos a devolver",
    productsHint: "Bobinas, bolsones, desperdicio o mezcla sobrante de esta OP.",
    details: "Motivo (opcional)",
    detailsHint: "Observación operativa para almacén.",
    type: "Tipo de devolución",
    typeHint: "Define el flujo de inventario y los campos requeridos.",
    material: "Material devuelto",
    materialHint: "Seleccione el insumo que regresa desde producción.",
  },
  placeholders: {
    quantity: "Ej. 45.5",
    reason: "Ej. Bobina dañada, sobrante no usado…",
    workOrderId: "Ej. 12",
    workOrderSelect: "Seleccione OP…",
    productSelect: "Seleccione producto…",
  },
  fields: {
    id: "N.º",
    kind: "Tipo",
    op: "OP",
    workOrder: "Trabajo en planta (OP)",
    route: "Ruta de devolución",
    product: "Producto",
    quantityUnits: "Cantidad",
    shift: "Turno",
    kg: "Kg",
    totalKg: "Total kg",
    material: "Material",
    supplier: "Proveedor",
    quantity: "Cantidad",
    destination: "Área destino",
    status: "Estado",
    reason: "Motivo",
    workOrderId: "Trabajo en planta (ID)",
  },
  errors: {
    workOrderRequired: "Seleccione la OP.",
    linesRequired: "Agregue al menos un producto.",
    invalidProduct: "Seleccione un producto válido.",
    duplicateBobina: "No repita la misma bobina.",
    invalidQuantity: (max: number) => `La cantidad debe ser entre 1 y ${max}.`,
  },
  addProduct: "Agregar producto",
  removeProduct: "Quitar",
  noProductsForWork: "No hay productos disponibles para devolver en esta OP.",
  loadingProducts: "Cargando productos…",
  loadProductsError: "No se pudieron cargar los productos de la OP.",
  routes: {
    fallas: "Fallas (verificar → materiales)",
    rejected: "Bobinas rechazadas",
    tintas: "Mezcla / tintas",
  },
  routeHints: {
    fallas: "Queda en inventario de fallas hasta enviar a materiales para reciclaje.",
    rejected: "Queda pendiente hasta verificar en bobinas rechazadas.",
    tintas: "Sobrante de mezcla; verifique para subir stock de tintas.",
  },
  kindHints: {
    good: "Incrementa stock de sustrato tras verificación.",
    rejected: "Queda pendiente hasta verificar en bobinas rechazadas.",
    tintas: "Sobrante de mezcla; verifique para subir stock.",
  },
  newReturn: "Nueva devolución",
  accept: "Verificar",
  accepting: "Verificando…",
  accepted: "Verificado",
  save: "Registrar",
  saving: "Guardando…",
  cancel: "Cancelar",
  loadError: "No se pudieron cargar las devoluciones.",
  saveError: "No se pudo registrar la devolución.",
  acceptError: "No se pudo verificar la devolución.",
  acceptSuccess: "Devolución verificada; ingreso aplicado al inventario.",
  releaseToMaterials: "Enviar a materiales",
  releasingToMaterials: "Enviando…",
  releaseToMaterialsSuccess: "Enviado a materiales. Reciclaje registrado.",
  releaseToMaterialsError: "No se pudo enviar a materiales.",
  verifyAndRelease: "Verificar y enviar a materiales",
  scrollActionsHint: "Deslice a la derecha si no ve el botón de acciones.",
  sentToMaterials: "En materiales",
  noWeightHint: "Sin peso registrado — pese la bobina en despacho primero.",
  saveSuccess: "Devolución registrada.",
  emptyTitle: "Sin devoluciones",
  emptyDescription: "No hay devoluciones con los filtros actuales.",
  tabs: {
    all: "Todas",
    good: "Buenas",
    rejected: "Malas",
    tintas: "Mezclas",
    fallas: "Fallas",
  },
  kind: {
    good: "Buena",
    rejected: "Rechazada",
    fallas: "Fallas",
  },
  table: {
    number: "N.º",
    actions: "Acciones",
  },
  count: (n: number) =>
    n === 1 ? "1 devolución" : `${n.toLocaleString("es-VE")} devoluciones`,
  materialSelect: "Seleccione material…",
  destinationSelect: "Área destino",
  defaultAcceptReason: "Verificado en devoluciones",
  status: {
    pending: "Pendiente",
    accepted: "Aceptada",
  },
} as const

export function returnDestinationLabel(area: string): string {
  return inventoryAreaLabel(area)
}

export function tabHint(tab: string): string {
  if (tab === "good") {
    return "Las devoluciones buenas incrementan el stock de sustrato al registrarse."
  }
  if (tab === "rejected") {
    return "Bobinas rechazadas (trabajo rudo): use Verificar y enviar a materiales para reciclar en sustrato."
  }
  if (tab === "tintas") {
    return "Devoluciones de sobrantes de mezcla. Verifique para subir stock."
  }
  if (tab === "fallas") {
    return "Devoluciones a fallas: verifique y luego envíe a materiales desde inventario de fallas."
  }
  return "Buenas alimentan sustrato; malas y mezclas requieren verificación de almacén."
}
