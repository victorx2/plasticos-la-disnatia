import type { LucideIcon } from "lucide-react"
import { Clock, Factory, FlaskConical, Layers, Recycle, ScrollText } from "lucide-react"

import { REPORTS_LABELS, type ReportTabId } from "@/features/reports/labels"

export const REPORT_TAB_SLUGS: Record<ReportTabId, string> = {
  times: "tiempos",
  total: "consumo-total",
  byOrder: "por-orden",
  production: "produccion-general",
  waste: "desperdicio",
  machine: "por-maquina",
}

const SLUG_TO_TAB = Object.fromEntries(
  Object.entries(REPORT_TAB_SLUGS).map(([tab, slug]) => [slug, tab]),
) as Record<string, ReportTabId>

export function reportTabFromSlug(slug: string | undefined): ReportTabId {
  if (slug && SLUG_TO_TAB[slug]) return SLUG_TO_TAB[slug]
  return "times"
}

export function isValidReportSlug(slug: string | undefined): boolean {
  return !!slug && slug in SLUG_TO_TAB
}

export function reportPathForTab(tab: ReportTabId): string {
  return `/reportes/${REPORT_TAB_SLUGS[tab]}`
}

export function reportTitleForPath(pathname: string): string | null {
  const slug = pathname.replace(/^\/+/, "").split("/")[1]
  if (!slug) return REPORTS_LABELS.title
  const tab = SLUG_TO_TAB[slug]
  return tab ? REPORTS_LABELS.tabs[tab].label : REPORTS_LABELS.title
}

export const REPORT_MENU_ITEMS: {
  title: string
  url: string
  icon: LucideIcon
  permissionId: "reportes"
}[] = (Object.keys(REPORTS_LABELS.tabs) as ReportTabId[]).map((tab) => ({
  title: REPORTS_LABELS.tabs[tab].label,
  url: `reportes/${REPORT_TAB_SLUGS[tab]}`,
  icon: (
    {
      times: Clock,
      total: FlaskConical,
      byOrder: ScrollText,
      production: Factory,
      waste: Recycle,
      machine: Layers,
    } satisfies Record<ReportTabId, LucideIcon>
  )[tab],
  permissionId: "reportes",
}))

export const REPORT_IMPLEMENTED_URLS = REPORT_MENU_ITEMS.map((item) => item.url)
