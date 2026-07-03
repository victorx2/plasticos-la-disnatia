export const SEALING_LABELS = {
  title: "Sellado",
  subtitle: "Registro de corte, unidades y desperdicio por trabajo en planta.",
  register: "Nuevo registro",
  registerTitle: "Registro de sellado",
  registerSubtitle:
    "Bobinas de extrusión precargadas por parte: medida, unidades, kg producción y desperdicio.",
  save: "Guardar registro",
  saving: "Guardando…",
  saveSuccess: "Registro de sellado guardado.",
  saveError: "No se pudo guardar el registro.",
  loadError: "No se pudieron cargar los trabajos.",
  exportCsv: "Descargar CSV",
  recentTitle: "Registros recientes",
  recentEmpty: "Sin registros de sellado aún.",
  count: (n: number) => (n === 1 ? "1 registro" : `${n.toLocaleString("es-VE")} registros`),
  fields: {
    work: "Trabajo en planta",
    shift: "Turno",
    waste: "Desperdicio (kg)",
    notes: "Observaciones",
    coilCode: "Bobina",
    measure: "Medida",
    units: "Unidades",
    productionKg: "Kg producción",
    wasteKg: "Kg desperdicio",
  },
  timerStart: "Iniciar",
  timerPause: "Pausar",
  timerStop: "Detener",
  coilsLoading: "Cargando bobinas de extrusión…",
  coilsFromExtrusion: (n: number) =>
    n === 1
      ? "1 bobina del último tramo de extrusión"
      : `${n.toLocaleString("es-VE")} bobinas del último tramo de extrusión`,
  coilsEmpty: "Sin bobinas de extrusión para este trabajo. Registre primero en extrusión.",
  addLine: "Agregar bobina",
  removeLine: "Quitar",
  linesSection: "Bobinas utilizadas para cortar",
  validation: {
    workRequired: "Seleccione el trabajo en planta.",
    linesRequired: "Registre al menos una bobina con unidades.",
  },
} as const

export function sealingShiftLabel(shift: string): string {
  const map: Record<string, string> = { mañana: "Mañana", tarde: "Tarde", noche: "Noche" }
  return map[shift] ?? shift
}
