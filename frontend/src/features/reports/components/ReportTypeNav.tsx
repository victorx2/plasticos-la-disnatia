import { REPORTS_LABELS, type ReportTabId } from "@/features/reports/labels"
import { accentIconWrap, accentNavActive, REPORT_TAB_ACCENTS, REPORT_TAB_ICONS } from "@/features/reports/reportTheme"
import { cn } from "@/shared/lib/utils"

type ReportTypeNavProps = {
  value: ReportTabId
  onChange: (id: ReportTabId) => void
}

export function ReportTypeNav({ value, onChange }: ReportTypeNavProps) {
  const tabIds = Object.keys(REPORTS_LABELS.tabs) as ReportTabId[]

  return (
    <nav
      aria-label="Tipo de reporte"
      className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:pb-0 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {tabIds.map((id) => {
        const meta = REPORTS_LABELS.tabs[id]
        const accent = REPORT_TAB_ACCENTS[id]
        const Icon = REPORT_TAB_ICONS[id]
        const isActive = value === id

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "flex min-h-[5.25rem] min-w-[10.5rem] shrink-0 flex-col items-start gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:min-w-0 sm:p-4",
              isActive && accentNavActive[accent],
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                accentIconWrap[accent],
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
            <span className="line-clamp-2 text-xs leading-snug text-slate-500">{meta.description}</span>
          </button>
        )
      })}
    </nav>
  )
}
