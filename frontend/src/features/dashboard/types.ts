/** Respuesta de GET /dashboard/summary — contrato API Python. */
export type DashboardSummaryDto = {
  generated_at: string
  month_label?: string
  /** Kg mezcla del mes — futuro backend Acarigua. */
  mixing_month_kg?: string
  /** Kg extrusión del mes — futuro backend Acarigua. */
  extrusion_month_kg?: string
  materials_total: number
  rejected_returns_bobinas_month?: number
  inventory_returns_pending: number
  material_requests_pending: number
  operational_alerts_unread: number
  movements_today: number
  materials_low_stock: Array<{ id: number; sku: string; name: string }>
  production_by_area_month?: Array<{
    label: string
    month_key: string
    tintas_kg: string
    total_kg: string
  }>
}

export type DashboardKpiTone = "neutral" | "attention" | "critical"

export type DashboardKpiGroup = "production" | "inventory" | "action"

export type DashboardKpiIconName =
  | "flask"
  | "factory"
  | "bell"
  | "trending"
  | "inbox"
  | "package-x"
  | "boxes"

export type DashboardKpi = {
  id: string
  title: string
  hint: string
  displayValue: string
  href?: string
  iconName: DashboardKpiIconName
  tone: DashboardKpiTone
  badge?: string
  group: DashboardKpiGroup
}

export type DashboardKpiSection = {
  id: DashboardKpiGroup
  title: string
  kpis: DashboardKpi[]
}

export type DashboardViewModel = {
  monthLabel: string
  generatedAt: string
  sections: DashboardKpiSection[]
}
