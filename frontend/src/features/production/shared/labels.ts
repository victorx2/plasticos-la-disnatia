export type ProductionFlowStep = "orden" | "programacion" | "mezcla" | "extrusion" | "sellado"

export const PRODUCTION_FLOW_LABELS = {
  steps: {
    orden: "Orden de producción",
    programacion: "Programación",
    mezcla: "Mezcla",
    extrusion: "Extrusión",
    sellado: "Sellado",
  } as const satisfies Record<ProductionFlowStep, string>,
  stepNumber: (n: number) => String(n),
  emptyStepsTitle: "Siguiente paso",
  formSectionClient: "Cliente y destino",
  formSectionClientHint: "Datos comerciales del pedido.",
  formSectionNotes: "Notas",
  formSectionNotesHint: "Información adicional opcional.",
  formSectionLines: "Ítems a fabricar",
  formSectionLinesHint: "Productos, cantidades y unidades del pedido.",
  formSectionWork: "Trabajo en planta",
  formSectionWorkHint: "Seleccione la orden de operación (trabajo en planta) programada.",
  formSectionColor: "Producto solicitado",
  formSectionColorHint: "Producto que pidió el cliente en este trabajo.",
  formSectionComponents: "Mezcla — materias primas",
  formSectionComponentsHint: "Suma de dos o más materias primas con cantidad en kg.",
  componentsTotal: (total: string) => `Total mezcla: ${total} kg`,
  selectWorkBanner: "Seleccione un trabajo en planta para ver mezclas y registrar materia prima.",
  stickySaveHint: "Los cambios se guardan al confirmar.",
} as const

export type ProductionFlowStepItem = {
  label: string
  href?: string
  done?: boolean
}
