export const EXTRUSION_LABELS = {
  title: "Extrusión",
  subtitle: "Resumen del área y accesos operativos.",
  monthProduction: "Producción del mes",
  monthHint: (monthLabel: string) => `Total kg reportados en ${monthLabel}.`,
  dailyTitle: "Cuadro del día — líneas 1 a 7",
  dailyLineColumn: "Línea",
  dailyShiftColumn: "Turno(s)",
  dailyCoilsColumn: "Bobinas",
  dailyWasteColumn: "Kg desperdicio",
  dailyCoreColumn: "Kg core",
  dailyEmpty: "Sin producción registrada hoy.",
  dailyEmptyCta: "Registrar producción",
  dailyLoadError: "No se pudo cargar el resumen del día.",
  loadError: "No se pudo cargar el resumen de producción.",
  exportCsv: "Descargar CSV",
  actionsTitle: "Acciones rápidas",
  registerProduction: "Registrar producción",
  registerProductionHint: "Cuadro por línea 1–7; micrajes opcionales al registrar.",
  actions: {
    request: "Solicitar insumos",
    requestHint: "Pedir material al almacén desde producción.",
    return: "Registrar devolución",
    returnHint: "Devolver sobrante o material rechazado.",
    movements: "Ver movimientos",
    movementsHint: "Historial de entradas y salidas de inventario.",
  },
} as const

export const EXTRUSION_REGISTER_LABELS = {
  title: "Registro de extrusión",
  subtitle: "Cuadro operativo: máquina, turno, kg y bobinas; micrajes en Avanzado.",
  plantBoardTitle: "Cuadro de planta",
  plantBoardHint: "Una fila por tramo: máquina, turno, hora, kg producidos, medida y cantidad de bobinas.",
  mixtureBannerInitial: "Kg disponibles en submezcla",
  mixtureBannerDispatched: "Kg despachados en submezcla",
  mixtureBannerUsed: "Kg registrados",
  mixtureBannerRemaining: "Kg restantes",
  mixtureBannerHelp:
    "Despachados = total entregado por almacén · Restantes = saldo actual (incluye desperdicio registrado) menos el tramo en edición.",
  productionOrderNop: "N.º OP",
  mixtureOverProductionHint: (overKg: string, budgetKg: string) =>
    `Está registrando ${overKg} kg más de los ${budgetKg} kg de submezcla de este trabajo. Se asume mezcla de otra OP: indique el trabajo destino en «Cambio de orden».`,
  mixtureOverProductionToast: (overKg: string) =>
    `Observación: producción ${overKg} kg por encima de la submezcla de este trabajo (mezcla de otra orden).`,
  producedKg: "Kg producidos",
  coilsCount: "Cantidad de bobinas",
  measure: "Medida",
  registerProduction: "Registro",
  registerProductionHint:
    "Guarda el tramo en la OP sin cerrar la sesión. Requiere línea (1–7) y al menos kg con bobinas, tiempo (≥1 s) o desperdicio.",
  registerProductionSaving: "Guardando tramo…",
  registerProductionSuccess:
    "Tramo guardado. Use «Registro de producción → almacén» o «→ sellado» para cerrar y continuar.",
  registerProductionError: "No se pudo guardar el tramo.",
  sendToDispatch: "Reg. producción → almacén",
  sendToDispatchSaving: "Cerrando y enviando a almacén…",
  sendToDispatchSuccess: "Producción cerrada. Bobinas disponibles en despacho.",
  sendToDispatchDiscardPending:
    "Tramo en edición sin cerrar (tiempo o kg incompletos). Se envió a almacén lo ya registrado.",
  sendToDispatchError: "No se pudo cerrar la sesión para almacén.",
  sendToSealing: "Reg. producción → sellado",
  sendToSealingSaving: "Cerrando y enviando a sellado…",
  sendToSealingSuccess: "Producción cerrada. Bobinas listas en sellado.",
  sendToSealingDiscardPending:
    "Tramo en edición sin cerrar (tiempo o kg incompletos). Se envió a sellado lo ya registrado.",
  sendToSealingError: "No se pudo cerrar la sesión para sellado.",
  remainingMixtureTitle: "Submezcla sobrante",
  remainingMixtureMessage: (kg: string) =>
    `Quedan ${kg} de submezcla sin usar. Puede seguir en máquinas o haberse usado en otra orden.`,
  requestMoreMp: "Solicitar más insumos",
  viewPrincipalMixture: "Ver mezcla principal",
  saveRemainingMixture: "Guardar sobrante",
  continueExtrusion: "Continuar extrusión",
  dismissModal: "Cerrar",
  goToDispatch: "Ir a despacho",
  goToSealing: "Ir a sellado",
  sendMixtureToWarehouse: "Enviar mezcla a almacén",
  returnMixtureKgPlaceholder: "Kg a devolver",
  sendMixtureToWarehouseSaving: "Enviando…",
  sendMixtureToWarehouseSuccess: "Solicitud de entrada a almacén creada.",
  sendMixtureToWarehouseError: "No se pudo enviar la mezcla a almacén.",
  advancedMicronsTitle: "Micrajes M1–M7 (avanzado)",
  micronsOptionalTitle: "Detalle de micrajes (opcional)",
  micronsOptionalHint:
    "Micraje M1–M7 = lecturas por bobina. No es obligatorio para registrar ni enviar a despacho.",
  micronsExpand: "Mostrar micrajes",
  micronsCollapse: "Ocultar micrajes",
  back: "Volver a extrusión",
  cancel: "Cancelar",
  save: "Guardar registro",
  saving: "Guardando…",
  finalizeShift: "Finalizar turno + temporizador",
  finalizeShiftSaving: "Guardando tramo…",
  finalizeShiftSuccess: "Tramo guardado. Puede continuar otro operador en la misma OP.",
  finalizeShiftError: "No se pudo guardar el tramo.",
  closeComplete: "Finalizado completamente",
  closeCompleteSaving: "Cerrando producción…",
  closeCompleteSuccess: "Producción de extrusión cerrada.",
  closeCompleteError: "No se pudo cerrar la producción.",
  accumulatedTitle: "Acumulado hoy (misma OP)",
  accumulatedEmpty: "Sin tramos guardados aún.",
  accumulatedTotalKg: "Total acumulado",
  accumulatedTotalMinutes: "Minutos acumulados",
  operatorLabel: "Operador actual",
  saveSuccess: "Registro de extrusión guardado.",
  saveSuccessPendingApi:
    "Registro validado. Se guardará en el sistema cuando el API de extrusión esté disponible.",
  saveError: "No se pudo guardar el registro de extrusión.",
  loadWorksError: "No se pudieron cargar los trabajos en extrusión.",
  workSelect: "Seleccione trabajo…",
  workLoading: "Cargando trabajos…",
  noWorks: "No hay trabajos en etapa Extrusión. Muévalos desde Programación.",
  retry: "Reintentar",
  coilsTitle: "Formato de producción — bobinas 1 a 5",
  totalProduced: "Total producido",
  targetKg: "Objetivo",
  machinePlaceholder: "Seleccione línea…",
  machineSelect: "Seleccione línea…",
  productBannerTitle: "Producto en planta",
  totalCoils: "Total bobinas",
  coreKg: "Peso del core (kg)",
  timerTitle: "Temporizador de producción",
  timerIdle: "Sin iniciar",
  timerRunning: "En producción",
  timerPaused: "Pausado",
  timerStart: "Iniciar",
  timerPause: "Pausar",
  timerResume: "Reanudar",
  timerStop: "Finalizar",
  timerElapsed: "Duración efectiva",
  timerSelectMachine: "Paso 1: elija la línea (1–7) abajo. El temporizador arranca al seleccionar.",
  timerSelectMachineInline: "¿En qué línea produce?",
  timerMachineSelectHint: "Al elegir la línea, el tiempo inicia automáticamente.",
  timerMachineLine: (line: string) => `Línea ${line}`,
  timerAutoPaused: "Pausado al salir de la pantalla. Pulse Reanudar para continuar.",
  timerPausedHint:
    "El tiempo dejó de contar. Pulse Reanudar si aún está produciendo, o Finalizar al terminar el tramo.",
  wasteTitle: "Desperdicio",
  wasteRefil: "Refil (kg)",
  wasteTransparente: "Transparente (kg)",
  bolsonesKg: "Kg bolsones",
  fallasKg: "Kg fallas",
  formatTitle: "Formato de producción",
  formatSelect: "Seleccione formato…",
  reassignTitle: "Cambio de orden",
  reassignHint:
    "Si la producción va para otro cliente/OP, elija «Trabajo destino». Si usa mezcla de otra OP, indique «OP origen de mezcla».",
  mixtureSourceTitle: "Origen de mezcla (cruce)",
  mixtureSourceHint:
    "Mezcla de otra OP: seleccione de qué trabajo provino. Si registra más kg que la submezcla de este trabajo, también indique el origen.",
  reassignEmpty:
    "No hay otros trabajos en planta. Programe la orden del otro cliente en Programación (etapa mezcla o extrusión).",
  mixtureSourceNone: "Misma OP / automático",
  reassignNone: "Sin cambio",
  postSaveTitle: "Registro guardado",
  postSaveBadReturn: "Registrar devolución mala",
  postSaveBadReturnHint: "Solo devolución mala — enviar a almacén (bobinas rechazadas).",
  postSaveBack: "Ir al panel de extrusión",
  fields: {
    work: "Trabajo en planta (OP)",
    shift: "Turno",
    time: "Hora de registro",
    machine: "Máquina",
    producedKg: "Kg producidos",
    coilsCount: "Cantidad bobinas",
    measure: "Medida",
    reassign: "Trabajo destino",
    mixtureSource: "OP origen de mezcla",
  },
  columns: {
    coil: "BOBINA",
    kg: "KG",
  },
  formats: {
    refil: "Refil",
    transparente: "Transparente",
    estandar: "Estándar",
  },
  validation: {
    workRequired: "Seleccione un trabajo en planta.",
    timeRequired: "Indique la hora de registro.",
    formatRequired: "Seleccione el formato de producción.",
    coilRequired: "Registre al menos una bobina (1–5) con kg mayor a cero.",
    kgRequired: "Cada bobina activa debe tener kg mayor a cero.",
    micronInvalid: "Los micrajes deben ser números válidos mayores o iguales a cero.",
    segmentEmpty: "Registre tiempo (≥1 s), bobinas o desperdicio antes de guardar el tramo.",
    machineRequired: "Seleccione la máquina (línea 1–7).",
    producedKgRequired: "Indique los kg producidos del tramo.",
    coilsCountRequired: "Indique la cantidad de bobinas (1–99) o registre tiempo/desperdicio.",
    coilsCountInvalid: "La cantidad de bobinas debe ser entre 1 y 99.",
    timerRequired: "Inicie el temporizador y deje al menos 1 segundo antes de registrar.",
    validationBlocked: "Complete los campos indicados para registrar el tramo.",
    noSegmentsToClose: "Guarde al menos un tramo antes de cerrar la producción.",
    maxCoils: "Máximo 5 bobinas por tramo.",
  },
} as const

const SHIFT_ES: Record<string, string> = {
  mañana: "Mañana",
  tarde: "Tarde",
  noche: "Noche",
}

export function extrusionShiftLabel(shift: string): string {
  return SHIFT_ES[shift] ?? shift
}

export function extrusionMicronLabel(index: number): string {
  return `Micraje M${index + 1}`
}

/** Cabecera tabla papel (M1…M7). */
export function extrusionMicronColumnLabel(index: number): string {
  return `M${index + 1}`
}

export function extrusionMachineLabel(line: string): string {
  return `Línea ${line}`
}

export function extrusionFormatLabel(format: string): string {
  const key = format as keyof typeof EXTRUSION_REGISTER_LABELS.formats
  return EXTRUSION_REGISTER_LABELS.formats[key] ?? format
}

export function formatTimerDisplay(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":")
}
