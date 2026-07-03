import type { BoardStage } from "@/features/programacion/types"

export const PROGRAMACION_LABELS = {
  title: "Programación",
  subtitle: "Programe pedidos nuevos y avance trabajos por etapa.",
  loadError: "No se pudo cargar el tablero de programación.",
  moveError: "No se pudo mover el trabajo en planta.",
  scheduleError: "No se pudo programar la orden.",
  scheduleSuccess: "Orden programada en planta.",
  pendingSection: "Líneas sin programar",
  pendingEmpty: "Todo programado — no hay líneas en cola.",
  pendingCount: (n: number) => `${n} pendiente${n === 1 ? "" : "s"}`,
  boardSection: "Trabajos en planta",
  columns: {
    code: "Código",
    client: "Cliente",
    product: "Producto",
    productionOrder: "Orden",
    stage: "Etapa",
    actions: "Acciones",
  },
  pendingColumns: {
    code: "Orden",
    item: "Ítem",
    client: "Cliente",
    product: "Producto",
    quantity: "Cantidad",
    actions: "Acciones",
  },
  schedule: "Programar",
  scheduling: "Programando…",
  moveStage: "Mover a",
  moving: "Moviendo…",
  emptyStage: (stage: string) =>
    `Ningún trabajo en ${stage}. Mueva trabajos desde otra etapa o programe un pedido.`,
  emptyStageScheduleCta: "Programar un pedido",
  emptyStageCreateOrder: "Crear orden de producción",
  count: (n: number) => `${n} trabajo${n === 1 ? "" : "s"}`,
  viewMixtures: "Ver mezclas",
  continueExtrusion: "Continuar extrusión",
} as const

const STAGE_ES: Record<BoardStage, string> = {
  nueva: "Nueva",
  pendiente: "Pendiente",
  mezcla: "Mezcla",
  extrusion: "Extrusión",
  completada: "Completada",
}

export function boardStageLabel(stage: string): string {
  return STAGE_ES[stage as BoardStage] ?? stage
}
