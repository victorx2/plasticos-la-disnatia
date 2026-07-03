import { DASHBOARD_LABELS } from "@/features/dashboard/labels"
import type {
  DashboardKpi,
  DashboardKpiGroup,
  DashboardKpiSection,
  DashboardKpiTone,
  DashboardSummaryDto,
  DashboardViewModel,
} from "@/features/dashboard/types"
import { formatCount, formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

const SECTION_ORDER: DashboardKpiGroup[] = ["production", "inventory", "action"]

const SECTION_TITLES: Record<DashboardKpiGroup, string> = {
  production: DASHBOARD_LABELS.sections.production,
  inventory: DASHBOARD_LABELS.sections.inventory,
  action: DASHBOARD_LABELS.sections.action,
}

function monthHint(summary: DashboardSummaryDto): string {
  return summary.month_label
    ? DASHBOARD_LABELS.monthAccumulated(summary.month_label)
    : DASHBOARD_LABELS.monthCurrent
}

function resolveMixingKg(summary: DashboardSummaryDto): string {
  if (summary.mixing_month_kg) return summary.mixing_month_kg
  const rows = summary.production_by_area_month ?? []
  const current = rows.length > 0 ? rows[rows.length - 1] : undefined
  return current?.tintas_kg ?? "0"
}

function resolveExtrusionKg(summary: DashboardSummaryDto): string {
  return summary.extrusion_month_kg ?? "0"
}

function resolveBadge(tone: DashboardKpiTone): string | undefined {
  if (tone === "attention") return DASHBOARD_LABELS.badges.review
  if (tone === "critical") return DASHBOARD_LABELS.badges.attention
  return undefined
}

function resolveKpiTone(
  id: DashboardKpi["id"],
  summary: DashboardSummaryDto,
): DashboardKpiTone {
  const lowStockCount = summary.materials_low_stock?.length ?? 0
  const mixingKg = parseKgNumber(resolveMixingKg(summary))
  const extrusionKg = parseKgNumber(resolveExtrusionKg(summary))

  if (id === "alerts-unread" && summary.operational_alerts_unread > 0) {
    return "critical"
  }

  if (id === "material-requests" && summary.material_requests_pending > 0) {
    return "attention"
  }

  if (id === "returns-pending" && summary.inventory_returns_pending > 0) {
    return "attention"
  }

  if (id === "low-stock" && lowStockCount > 0) {
    return "attention"
  }

  if (id === "extrusion-production" && extrusionKg === 0 && mixingKg > 0) {
    return "attention"
  }

  return "neutral"
}

function groupKpisIntoSections(kpis: DashboardKpi[]): DashboardKpiSection[] {
  return SECTION_ORDER.map((group) => ({
    id: group,
    title: SECTION_TITLES[group],
    kpis: kpis.filter((kpi) => kpi.group === group),
  })).filter((section) => section.kpis.length > 0)
}

export function buildDashboardViewModel(summary: DashboardSummaryDto): DashboardViewModel {
  const hint = monthHint(summary)
  const lowStockCount = summary.materials_low_stock?.length ?? 0

  const baseKpis: Omit<DashboardKpi, "badge">[] = [
    {
      id: "mixing-production",
      title: DASHBOARD_LABELS.kpis.mixingProduction,
      hint: `${hint} ${DASHBOARD_LABELS.kpis.mixingHint}`,
      displayValue: formatKgDisplay(resolveMixingKg(summary)),
      href: "/mezcla",
      iconName: "flask",
      tone: resolveKpiTone("mixing-production", summary),
      group: "production",
    },
    {
      id: "extrusion-production",
      title: DASHBOARD_LABELS.kpis.extrusionProduction,
      hint: `${hint} ${DASHBOARD_LABELS.kpis.extrusionHint}`,
      displayValue: formatKgDisplay(resolveExtrusionKg(summary)),
      href: "/extrusion",
      iconName: "factory",
      tone: resolveKpiTone("extrusion-production", summary),
      group: "production",
    },
    {
      id: "rejected-bobinas",
      title: DASHBOARD_LABELS.kpis.rejectedBobinas,
      hint: `${hint} ${DASHBOARD_LABELS.kpis.rejectedBobinasHint}`,
      displayValue: formatCount(summary.rejected_returns_bobinas_month ?? 0),
      href: "/devoluciones",
      iconName: "package-x",
      tone: resolveKpiTone("rejected-bobinas", summary),
      group: "production",
    },
    {
      id: "movements-today",
      title: DASHBOARD_LABELS.kpis.movementsToday,
      hint: DASHBOARD_LABELS.kpis.movementsHint,
      displayValue: formatCount(summary.movements_today),
      href: "/movimientos-inventario",
      iconName: "trending",
      tone: resolveKpiTone("movements-today", summary),
      group: "inventory",
    },
    {
      id: "low-stock",
      title: DASHBOARD_LABELS.kpis.lowStock,
      hint: DASHBOARD_LABELS.kpis.lowStockHint,
      displayValue: formatCount(lowStockCount),
      href: "/materiales",
      iconName: "boxes",
      tone: resolveKpiTone("low-stock", summary),
      group: "inventory",
    },
    {
      id: "material-requests",
      title: DASHBOARD_LABELS.kpis.materialRequests,
      hint: DASHBOARD_LABELS.kpis.materialRequestsHint,
      displayValue: formatCount(summary.material_requests_pending),
      href: "/solicitudes-material",
      iconName: "inbox",
      tone: resolveKpiTone("material-requests", summary),
      group: "action",
    },
    {
      id: "returns-pending",
      title: DASHBOARD_LABELS.kpis.returnsPending,
      hint: DASHBOARD_LABELS.kpis.returnsHint,
      displayValue: formatCount(summary.inventory_returns_pending),
      href: "/devoluciones",
      iconName: "package-x",
      tone: resolveKpiTone("returns-pending", summary),
      group: "action",
    },
    {
      id: "alerts-unread",
      title: DASHBOARD_LABELS.kpis.alertsUnread,
      hint: DASHBOARD_LABELS.kpis.alertsHint,
      displayValue: formatCount(summary.operational_alerts_unread),
      href: "/alertas",
      iconName: "bell",
      tone: resolveKpiTone("alerts-unread", summary),
      group: "action",
    },
  ]

  const kpis: DashboardKpi[] = baseKpis.map((kpi) => ({
    ...kpi,
    badge: resolveBadge(kpi.tone),
  }))

  return {
    monthLabel: summary.month_label ?? "",
    generatedAt: summary.generated_at,
    sections: groupKpisIntoSections(kpis),
  }
}

/** Útil para tests: valida que el mapeo no dependa de kg negativos. */
export function hasProductionActivity(summary: DashboardSummaryDto): boolean {
  return (
    parseKgNumber(resolveMixingKg(summary)) > 0 ||
    parseKgNumber(resolveExtrusionKg(summary)) > 0
  )
}
