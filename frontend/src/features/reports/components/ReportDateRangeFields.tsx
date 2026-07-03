import { ArrowRight, CalendarDays } from "lucide-react"

import { REPORTS_LABELS, type ReportTabId } from "@/features/reports/labels"
import {
  accentDateDivider,
  accentDateIcon,
  accentDateInputFocus,
  accentDateShell,
  accentEyebrow,
  type ReportAccent,
} from "@/features/reports/reportTheme"
import { cn } from "@/shared/lib/utils"

type ReportDateRangeFieldsProps = {
  tab: ReportTabId
  accent: ReportAccent
  fromDate: string
  toDate: string
  onFromDateChange: (value: string) => void
  onToDateChange: (value: string) => void
}

function DateField({
  id,
  label,
  value,
  onChange,
  accent,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  accent: ReportAccent
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-1 items-center rounded-lg bg-white/60 transition-shadow",
        accentDateInputFocus[accent],
      )}
    >
      <CalendarDays
        className={cn("pointer-events-none absolute left-2.5 h-4 w-4 shrink-0", accentDateIcon[accent])}
        aria-hidden
      />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 w-full min-w-0 rounded-lg border-0 bg-transparent py-1 pl-9 pr-2 text-sm font-medium text-slate-800",
          "placeholder:text-slate-400 focus:outline-none",
          "[color-scheme:light]",
        )}
      />
    </div>
  )
}

export function ReportDateRangeFields({
  tab,
  accent,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: ReportDateRangeFieldsProps) {
  return (
    <div className="min-w-0 flex-1 sm:max-w-xl">
      <p className={cn("mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]", accentEyebrow[accent])}>
        {REPORTS_LABELS.periodLabel}
      </p>
      <div className={cn("flex flex-col gap-2 p-2 sm:flex-row sm:items-center", accentDateShell[accent])}>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center">
          <span className="hidden shrink-0 px-1 text-[11px] font-medium text-slate-500 sm:inline">
            {REPORTS_LABELS.fromDate}
          </span>
          <DateField
            id={`rep-from-${tab}`}
            label={REPORTS_LABELS.fromDate}
            value={fromDate}
            onChange={onFromDateChange}
            accent={accent}
          />
        </div>
        <ArrowRight
          className={cn("mx-auto hidden h-4 w-4 shrink-0 sm:block", accentDateDivider[accent])}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center">
          <span className="hidden shrink-0 px-1 text-[11px] font-medium text-slate-500 sm:inline">
            {REPORTS_LABELS.toDate}
          </span>
          <DateField
            id={`rep-to-${tab}`}
            label={REPORTS_LABELS.toDate}
            value={toDate}
            onChange={onToDateChange}
            accent={accent}
          />
        </div>
      </div>
    </div>
  )
}
