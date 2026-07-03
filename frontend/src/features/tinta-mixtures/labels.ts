export const MIXING_LABELS = {
  listTitle: "Mezcla",
  listSubtitle: "Mezcla (receta) y submezcla (despacho) por trabajo en planta.",
  listHelp:
    "Al solicitar insumos, 1 materia prima + otra = mezcla (receta completa). Cuando almacén despacha, se crea una submezcla con las cantidades de ese tramo — desde ahí se inicia extrusión.",
  outputAreaResina: "Resina",
  outputAreaResinaHint: "Salida de mezcla — resina para extrusión (no tintas).",
  formTitle: "Nueva mezcla (ajuste manual)",
  formSubtitle: "Solo si necesita corregir o registrar una mezcla fuera del despacho de almacén.",
  formHelp:
    "Lo habitual: solicitar insumos y dejar que almacén genere la mezcla al despachar. Use este formulario solo para ajustes manuales.",
  newMixture: "Ajuste manual",
  save: "Registrar mezcla",
  saving: "Guardando…",
  cancel: "Cancelar",
  loadError: "No se pudieron cargar las mezclas.",
  loadWorksError: "No se pudieron cargar los trabajos en planta.",
  saveError: "No se pudo registrar la mezcla.",
  saveSuccess: "Mezcla manual registrada.",
  emptyTitle: "Sin mezclas ni submezclas",
  emptyTitleFiltered: "Sin registros para este trabajo",
  emptyDescription:
    "Solicite insumos (mezcla) a almacén; las submezclas aparecerán al despachar materia prima.",
  emptyDescriptionFiltered:
    "Solicite insumos para este trabajo. Al despachar, almacén generará la submezcla para extrusión.",
  emptyStepProgramacion: "Programar orden en planta",
  emptyStepSelectWork: "Seleccionar trabajo en planta",
  emptyStepRequestInsumos: "Solicitar insumos a almacén",
  noWorksCallout: "No hay trabajos en planta.",
  noWorksCalloutLink: "Ir a Programación",
  workFilter: "Trabajo en planta",
  workFilterAll: "Todos los trabajos",
  workFilterSelect: "Filtrar por trabajo…",
  workFilterClear: "Ver todas las mezclas",
  workFilterActive: (code: string) => `Mostrando mezclas del trabajo ${code}`,
  newMixtureForWork: "Ajuste manual",
  requestInsumosForWork: "Solicitar insumos",
  requestInsumos: "Solicitar insumos",
  fields: {
    outputSku: "Código trabajo",
    outputName: "Producto solicitado",
    orderQuantity: "Cantidad pedida",
    subarea: "Tipo de salida",
    notes: "Notas",
    components: "Materias primas",
    componentMaterial: "Materia prima",
    componentQty: "Cantidad (kg)",
    componentsCount: "Materias primas",
    totalKg: "Total mezcla",
    createdAt: "Creado",
    creator: "Operador",
    work: "Trabajo en planta",
    kind: "Tipo",
  },
  formSectionProduct: "Producto del trabajo",
  formSectionProductHint: "Producto que pidió el cliente en la orden de operación seleccionada.",
  formSectionMixture: "Mezcla — materias primas",
  formSectionMixtureHint: "Suma de dos o más materias primas con cantidad en kg.",
  workSelect: "Seleccione trabajo…",
  workLoading: "Cargando trabajos…",
  noWorks: "No hay trabajos en planta. Programe una orden primero.",
  validation: {
    workRequired: "Seleccione el trabajo en planta.",
  },
  addComponent: "Agregar materia prima",
  removeComponent: "Quitar",
  componentsMinError: "Agregue al menos dos materias primas con cantidad en kg.",
  duplicateMaterialError: "No repita la misma materia prima en la mezcla.",
  prefillFromRequest: "Materias primas cargadas desde la solicitud de insumos de este trabajo.",
  requestedKgFromNotes: (kg: string) => `Kg solicitados en observaciones: ${kg} kg`,
  prefillEmpty:
    "Registre al menos dos materias primas en kg. Ejemplo: 3.000 metalloceno + 2.000 metanol = 5.000 kg.",
  totalMatchesOrder: "La suma de la mezcla coincide con la cantidad pedida.",
  totalBelowOrder: (missing: string) =>
    `Faltan ${missing} kg en la mezcla para cubrir lo pedido por el cliente.`,
  totalAboveOrder: (extra: string) =>
    `La mezcla supera en ${extra} kg la cantidad pedida. Revise las cantidades.`,
  noOrderQuantityHint: "Indique las cantidades en kg; deben sumar lo necesario para este producto.",
  noComponentMaterials:
    "No hay materias primas registradas. Cree materiales en Datos maestros (resina, pigmento, químicos, etc.).",
  table: {
    number: "N.º",
    actions: "Acciones",
  },
  count: (n: number) => (n === 1 ? "1 mezcla" : `${n.toLocaleString("es-VE")} mezclas`),
  searchLabel: "Buscar",
  searchPlaceholder: "Producto, trabajo u operador…",
  searchAriaLabel: "Buscar mezclas por producto, trabajo u operador",
  productionTitle: "Producción de mezcla",
  productionSubtitle: "Seleccione una submezcla despachada y comience extrusión.",
  productionStartHint:
    "Use la submezcla (cantidades que entregó almacén). Al culminar extrusión se genera el registro de producción.",
  mixtureKgToUse: "Kg disponibles en submezcla",
  mixtureKgDispatched: "Kg despachados en submezcla",
  mixtureKgPendingWarehouse: "Kg pendientes en almacén",
  mixtureKgAfterDispatch: "Kg disponibles tras despacho pendiente",
  continueExtrusion: "Continuar extrusión",
  continueExtrusionHint: (kg: string) =>
    `Quedan ${kg} en submezcla. Continúe sin volver a solicitar a almacén.`,
  openProduction: "Producción de mezclas",
  extrusionActiveBanner:
    "Hay una extrusión en curso para este trabajo. Use el botón para volver al registro.",
  extrusionActiveCta: "Continuar extrusión",
  startProduction: "Empezando producción",
  starting: "Iniciando…",
  startSuccess: "Producción iniciada.",
  startError: "No se pudo iniciar la producción.",
  activeRuns: "Mezclas en producción",
  selectMixture: "Seleccione submezcla",
  noMixtures: "No hay submezclas despachadas para este trabajo.",
  noMixturesHelp:
    "Para iniciar extrusión, almacén debe despachar la solicitud de insumos. La mezcla principal no basta: hace falta la submezcla (material ya entregado a producción).",
  noMixturesStepRequest: "1. Solicite insumos si aún no lo hizo.",
  noMixturesStepWarehouse: "2. Inventario debe despachar la solicitud en «Solicitudes de insumos».",
  noMixturesStepReturn: "3. Vuelva aquí: aparecerá la submezcla y podrá pulsar «Empezando producción».",
  noMixturesPendingWarehouse: (kg: string) =>
    `Hay ${kg} kg pendientes de despacho en almacén. Avise a inventario.`,
  noMixturesHasPrincipal: "Ya hay mezcla solicitada, pero falta el despacho de almacén.",
  culminatedQuestion: "¿Culminada producción de la mezcla?",
  fullyUsedQuestion: "¿Utilizaste completamente esta mezcla?",
  yes: "Sí",
  no: "No",
  reason: "Razón",
  usedOtherOrder: "¿Fue usada para otra orden?",
  otherOrderId: "N° trabajo en planta donde se usó",
  remainingKg: "Kg restantes en la mezcla",
  complete: "Registrar culminación",
  completing: "Guardando…",
  completeSuccess: "Producción de mezcla registrada.",
  completeError: "No se pudo completar el registro.",
  requestMoreMp: "Solicitar más materia prima",
  requestMoreMpHint:
    "Solicite más insumos si quedan kg en la mezcla principal. La submezcla crece al despachar en almacén.",
  sendToWarehouse: "Solicitar envío a almacén",
  loadRunsError: "No se pudieron cargar las producciones activas.",
  historyTitle: "Historial de mezclas",
  historyEmpty: "Sin registros de producción para este trabajo.",
  historyRoleOrigen: "Producida aquí",
  historyRoleDestino: "Usada desde otro trabajo",
  historyProducedKg: "Kg producidos",
  historyExtrusion: "Registro extrusión",
  historyInbound: "Solicitud entrada almacén",
  completeWithExtrusion: "Registro de extrusión creado automáticamente.",
  completeWithInbound: "Solicitud de entrada a almacén creada.",
  viewHistory: "Ver historial",
} as const

export function mixtureKindLabel(kind: string | null | undefined): string {
  const map: Record<string, string> = {
    mezcla: "Mezcla",
    submezcla: "Submezcla",
    manual: "Manual",
  }
  return map[kind ?? ""] ?? kind ?? "—"
}

export function mixtureKindBadgeClass(kind: string | null | undefined): string {
  if (kind === "submezcla") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800"
  }
  if (kind === "mezcla") {
    return "border-violet-200 bg-violet-50 text-violet-800"
  }
  return "border-slate-200 bg-slate-50 text-slate-700"
}

/** @deprecated Axones legacy — Acarigua no usa subáreas de tinta. */
export const TINTA_SUBAREA_OPTIONS = [
  { value: "laminacion", label: "Laminación" },
  { value: "superficie", label: "Superficie" },
  { value: "prueba_laminacion", label: "Prueba laminación" },
  { value: "laminacion_nueva", label: "Laminación nueva" },
] as const
