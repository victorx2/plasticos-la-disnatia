import type { ReactNode } from "react"
import { CalendarRange } from "lucide-react"

import { BRANDING, brandAssetUrl } from "@/config/branding"
import { ReportDateRangeFields } from "@/features/reports/components/ReportDateRangeFields"
import { ReportExportButtons } from "@/features/reports/components/ReportExportButtons"
import { REPORTS_LABELS, type ReportTabId } from "@/features/reports/labels"
import type { ExportFormat } from "@/shared/export/types"
import {
  accentApplyButton,
  accentContentArea,
  accentEyebrow,
  accentFilterBar,
  accentIconWrap,
  accentMeshOrb,
  accentMeshOrbSecondary,
  accentPanelFrame,
  accentRecordBadge,
  accentSidebarRail,
  accentSidebarStripe,
  REPORT_TAB_ACCENTS,
  REPORT_TAB_ICONS,
} from "@/features/reports/reportTheme"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

type ReportPanelShellProps = {
  tab: ReportTabId
  recordCount?: number | null
  showDateFilters?: boolean
  fromDate: string
  toDate: string
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onApply: () => void
  onExport?: (format: ExportFormat) => void
  canExport?: boolean
  loading?: boolean
  children: ReactNode
}

function ReportFilterToolbar({
  tab,
  showDateFilters,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  onExport,
  canExport,
  loading,
  accent,
}: {
  tab: ReportTabId
  showDateFilters: boolean
  fromDate: string
  toDate: string
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
  onApply: () => void
  onExport?: (format: ExportFormat) => void
  canExport: boolean
  loading: boolean
  accent: (typeof REPORT_TAB_ACCENTS)[ReportTabId]
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b px-4 py-3 sm:px-5 sm:py-3.5 lg:flex-row lg:items-end lg:justify-between",
        accentFilterBar[accent],
      )}
    >
      {showDateFilters ? (
        <>
          <ReportDateRangeFields
            tab={tab}
            accent={accent}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
          />
          <div className="flex shrink-0 flex-wrap items-end gap-3 lg:gap-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={onApply}
              className={cn("h-9 border bg-transparent", accentApplyButton[accent])}
            >
              <CalendarRange className="h-3.5 w-3.5" aria-hidden />
              {REPORTS_LABELS.apply}
            </Button>
            <ReportExportButtons accent={accent} canExport={canExport} onExport={onExport} />
          </div>
        </>
      ) : (
        <div className="flex w-full flex-wrap items-end justify-end gap-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={onApply}
            className={cn("h-9 border bg-transparent", accentApplyButton[accent])}
          >
            {REPORTS_LABELS.apply}
          </Button>
          <ReportExportButtons accent={accent} canExport={canExport} onExport={onExport} />
        </div>
      )}
    </div>
  )
}

export function ReportPanelShell({
  tab,
  recordCount,
  showDateFilters = true,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  onExport,
  canExport = false,
  loading = false,
  children,
}: ReportPanelShellProps) {
  const meta = REPORTS_LABELS.tabs[tab]
  const accent = REPORT_TAB_ACCENTS[tab]
  const Icon = REPORT_TAB_ICONS[tab]

  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl", accentPanelFrame[accent])}
      aria-labelledby={`report-panel-title-${tab}`}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 hidden h-56 w-56 rounded-full blur-3xl md:block",
          accentMeshOrb[accent],
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 left-1/3 hidden h-40 w-40 rounded-full blur-3xl md:block",
          accentMeshOrbSecondary[accent],
        )}
        aria-hidden
      />

      <div className="relative flex flex-col lg:flex-row">
        <aside
          className={cn(
            "relative shrink-0 border-b lg:w-56 lg:border-b-0 lg:border-r xl:w-64",
            accentSidebarRail[accent],
          )}
        >
          <div
            className={cn("absolute inset-y-0 left-0 w-1 lg:w-1.5", accentSidebarStripe[accent])}
            aria-hidden
          />
          <div className="flex items-start gap-3 px-4 py-4 pl-5 sm:px-5 sm:pl-6 lg:flex-col lg:gap-4 lg:py-6 lg:pl-7">
            <img
              src={brandAssetUrl()}
              alt={BRANDING.siteName}
              className="h-10 max-w-[140px] shrink-0 object-contain lg:h-12 lg:max-w-[160px]"
            />
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset lg:hidden",
                accentIconWrap[accent],
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", accentEyebrow[accent])}>
                Reporte
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`report-panel-title-${tab}`} className="text-base font-semibold leading-snug text-slate-900">
                  {meta.title}
                </h2>
                {recordCount != null && recordCount > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
                      accentRecordBadge[accent],
                    )}
                  >
                    {REPORTS_LABELS.recordCount(recordCount)}
                  </span>
                ) : null}
              </div>
              <p className="hidden max-w-xs text-sm leading-relaxed text-slate-500 sm:block">{meta.description}</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <ReportFilterToolbar
            tab={tab}
            showDateFilters={showDateFilters}
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={onFromDateChange}
            onToDateChange={onToDateChange}
            onApply={onApply}
            onExport={onExport}
            canExport={canExport}
            loading={loading}
            accent={accent}
          />

          <div className={cn("relative flex-1 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6", accentContentArea[accent])}>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ReportEmptyState({
  tab,
  icon: Icon,
}: {
  tab: ReportTabId
  icon: React.ComponentType<{ className?: string }>
}) {
  const meta = REPORTS_LABELS.tabs[tab]
  const accent = REPORT_TAB_ACCENTS[tab]

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-white/50 px-4 py-14 text-center">
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset",
          accentIconWrap[accent],
        )}
      >
        <Icon className="h-7 w-7 opacity-80" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-slate-900">Sin datos en este reporte</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{meta.empty}</p>
    </div>
  )
}

export function ReportLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-12 text-center">
      <p className="text-sm font-semibold text-rose-950">{REPORTS_LABELS.loadError}</p>
      <p className="mt-1 max-w-md text-sm text-rose-800">{REPORTS_LABELS.loadErrorHint}</p>
      <Button type="button" size="sm" variant="outline" className="mt-4" onClick={onRetry}>
        {REPORTS_LABELS.retry}
      </Button>
    </div>
  )
}
