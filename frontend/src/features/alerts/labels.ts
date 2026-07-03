export const ALERT_LABELS = {
  listTitle: "Alertas",
  listSubtitle:
    "Alertas operativas generadas a partir de producción, inventario y pendientes del sistema.",
  loadError: "No se pudieron cargar las alertas.",
  syncError: "No se pudieron sincronizar las alertas.",
  markReadError: "No se pudo marcar la alerta como leída.",
  markAllReadError: "No se pudieron marcar todas las alertas como leídas.",
  markAllReadSuccess: (count: number) =>
    count === 1 ? "1 alerta marcada como leída." : `${count} alertas marcadas como leídas.`,
  markRead: "Marcar leída",
  markAllRead: "Marcar todas como leídas",
  refresh: "Actualizar",
  viewRelated: "Ir al módulo",
  unreadBanner: (count: number) =>
    count === 1 ? "1 alerta sin leer" : `${count} alertas sin leer`,
  emptyTitle: "Sin alertas",
  emptyUnreadTitle: "Sin alertas pendientes",
  emptyDescription: "No hay alertas operativas con los filtros actuales.",
  emptyUnreadDescription: "No hay alertas sin leer. El equipo está al día.",
  count: (total: number) => `${total.toLocaleString("es-VE")} alerta(s)`,
  filters: {
    visibility: "Mostrar",
    unreadOnly: "Solo sin leer",
    all: "Todas",
  },
  table: {
    number: "#",
    updated: "Actualizado",
    title: "Alerta",
    detail: "Detalle",
    status: "Estado",
    actions: "Acciones",
  },
  status: {
    unread: "Sin leer",
    read: "Leída",
  },
  severity: {
    attention: "Atención",
    critical: "Crítica",
    info: "Info",
  },
} as const

export function alertSeverityLabel(severity: string): string {
  if (severity === "critical") return ALERT_LABELS.severity.critical
  if (severity === "info") return ALERT_LABELS.severity.info
  return ALERT_LABELS.severity.attention
}

export function alertSeverityClass(severity: string): string {
  if (severity === "critical") return "bg-rose-50 text-rose-700"
  if (severity === "info") return "bg-sky-50 text-sky-700"
  return "bg-amber-50 text-amber-800"
}
