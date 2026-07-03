export const MATERIAL_REQUEST_LABELS = {
  formTitle: "Nueva solicitud de insumos",
  formSubtitle: "Pedido de materia prima hacia almacén, vinculado a un trabajo en planta.",
  reviewTitle: "Revisar contraoferta de almacén",
  reviewSubtitle: "Acepte o rechace la nueva lista de materiales propuesta por almacén.",
  save: "Enviar solicitud",
  saving: "Enviando…",
  cancel: "Cancelar",
  saveError: "No se pudo crear la solicitud.",
  saveSuccess: "Solicitud enviada. Saldo de mezcla principal actualizado.",
  loadFromMixtures: "Copiar saldo de mezcla principal",
  loadingMixtures: "Cargando mezcla principal…",
  loadMixturesError: "No se pudo cargar la mezcla principal.",
  loadMixturesEmpty:
    "No hay kg restantes en la mezcla principal. Active «Solicitud de reposición» y use «Copiar receta original».",
  loadMixturesSuccess: "Ítems cargados desde el saldo de la mezcla principal.",
  loadInitialRecipe: "Copiar receta original",
  loadInitialRecipeSuccess: "Ítems cargados desde la receta original del trabajo.",
  loadInitialRecipeEmpty: "No hay receta inicial registrada para este trabajo.",
  replenishmentTitle: "Mezcla principal agotada",
  replenishmentHint:
    "Si consumió la mezcla en otra OP o ya despachó todo el cupo, active «Solicitud de reposición» para pedir material extra a almacén (no descuenta del cupo inicial).",
  replenishmentToggle: "Solicitud de reposición (sin cupo en principal)",
  replenishmentNotesHint:
    "Indique en observaciones por qué pide más material (ej. mezcla usada en otra OP).",
  replenishmentSaveSuccess: "Solicitud de reposición enviada a almacén.",
  replenishmentSubmit: "Enviar reposición",
  openRequestTitle: "Solicitud abierta pendiente",
  openRequestHint: (requestId: number) =>
    `Ya hay una solicitud (#${requestId}) con material pendiente de despacho en almacén. No cree otra: use Solicitudes entre áreas para continuar ese pedido.`,
  openReplenishmentRequestTitle: "Reposición pendiente en almacén",
  openReplenishmentRequestHint: (requestId: number, pendingKg: string) =>
    `Ya envió una solicitud de reposición (#${requestId}) con ${pendingKg} kg pendientes de despacho. Vaya a Solicitudes entre áreas para que almacén la despache; no cree otra solicitud.`,
  openRequestAction: "Ir a solicitud en almacén",
  principalBalanceTitle: "Mezcla principal",
  principalBalanceHint:
    "Los kg restantes son el cupo total. Cada material (Cynpol, Bapolene, etc.) tiene su propio saldo — use «Copiar saldo» o respete el desglose de abajo.",
  principalByMaterialTitle: "Saldo por material (mezcla principal)",
  principalByMaterialHint:
    "La solicitud valida cada ítem por separado. No reparta cantidades «a ojo» si los materiales no están parejos.",
  lineExceedsMaterial: (material: string, maxKg: string, requestedKg: string) =>
    `${material}: pidió ${requestedKg} kg pero solo quedan ${maxKg} kg en la mezcla principal.`,
  viewPrincipalMixture: "Ver mezcla principal",
  fields: {
    notes: "Observaciones",
    originatingArea: "Área solicitante",
    destination: "Destino",
    description: "Descripción del ítem",
    quantity: "Cantidad",
    unit: "Unidad",
    material: "Material (opcional)",
    workOrder: "Trabajo en planta",
    clientOrderQuantity: "Kg pedidos por el cliente",
  },
  workSelect: "Seleccione trabajo…",
  workLoading: "Cargando trabajos…",
  noWorks: "No hay trabajos en planta. Programe una orden primero.",
  notesRequired: "Las observaciones son obligatorias.",
  workRequired: "Seleccione el trabajo en planta.",
  linesMinError: "Agregue al menos un ítem con descripción y cantidad.",
  addLine: "Agregar ítem",
  removeLine: "Quitar",
  linesSection: "Ítems solicitados",
  sections: {
    context: "Trabajo y enrutamiento",
    contextHint: "Vincule la solicitud al trabajo en planta y al área que solicita el material.",
    notes: "Observaciones",
    notesHint: "Motivo del pedido y detalles para almacén (obligatorio).",
    lines: "Ítems solicitados",
    linesHint: "Materiales y cantidades. Use «Copiar saldo» para cargar el cupo restante.",
    balance: "Mezcla principal — cupo disponible",
    balanceHint: "Saldo autorizado del trabajo antes de enviar la solicitud.",
  },
  placeholders: {
    notes: "Ej. Ajuste de receta, material adicional para corrida nocturna…",
    description: "Ej. Resina Cynpol · lote urgente",
    quantity: "Ej. 120.5",
    materialEmpty: "Sin material (solo descripción)",
    destination: "Almacén",
  },
  helpFlow:
    "La mezcla principal es el cupo total del trabajo. Al solicitar más insumos, indique lo que necesita: se restará de la principal. Al despachar, almacén suma a la submezcla existente.",
  helpWarehouseTitle: "Flujo en almacén",
  helpWarehouseSteps: [
    "Autorizar cupo (kg): almacén acepta la solicitud y fija cuántos kg puede retirar producción.",
    "Despachar: cada entrega resta del cupo y genera una submezcla con las cantidades de ese tramo.",
    "Recibir entrada: cuando aplique, confirme el ingreso de material devuelto o producido.",
  ],
  kg: {
    authorized: "Kg autorizados",
    dispatched: "Kg despachados",
    remaining: "Kg restantes",
    previewHint: "Total previsto al enviar (suma de ítems en kg). El cupo se confirma al registrar la solicitud.",
    dispatchHint: "Cada despacho resta del cupo autorizado.",
  },
  review: {
    originalLines: "Lista original",
    counterLines: "Contraoferta almacén",
    rejectionReason: "Motivo del rechazo",
    accept: "Aceptar contraoferta",
    accepting: "Aceptando…",
    reject: "Rechazar contraoferta",
    rejecting: "Rechazando…",
    acceptSuccess: "Contraoferta aceptada. Almacén puede continuar el despacho.",
    rejectSuccess: "Contraoferta rechazada.",
    acceptError: "No se pudo aceptar la contraoferta.",
    rejectError: "No se pudo rechazar la contraoferta.",
    loadError: "No se pudo cargar la solicitud.",
    notCounter: "Esta solicitud no tiene contraoferta pendiente de revisión.",
    back: "Volver a solicitudes",
  },
} as const

export const MATERIAL_REQUEST_UNITS = [
  { value: "kg", label: "Kg" },
  { value: "unidad", label: "Unidad" },
  { value: "rollo", label: "Rollo" },
] as const

export const ORIGINATING_AREAS = [
  { value: "mezcla", label: "Mezcla" },
  { value: "extrusion", label: "Extrusión" },
  { value: "produccion", label: "Producción" },
  { value: "almacen", label: "Almacén" },
] as const

export function materialRequestStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendiente",
    authorized: "Autorizada",
    partial: "Parcial",
    dispatched: "Despachada",
    rejected: "Rechazada",
    counter_proposed: "Contraoferta almacén",
    counter_accepted: "Contraoferta aceptada",
    counter_rejected: "Contraoferta rechazada",
    closed: "Cerrada",
    cancelled: "Anulada",
  }
  return map[status] ?? status
}
