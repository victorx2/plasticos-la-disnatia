import type { LucideIcon } from "lucide-react"
import { FileSpreadsheet, FileText, Table2 } from "lucide-react"

import { REPORTS_LABELS } from "@/features/reports/labels"
import {
  accentExportButton,
  accentExportDivider,
  accentExportShell,
  accentEyebrow,
  type ReportAccent,
} from "@/features/reports/reportTheme"
import type { ExportFormat } from "@/shared/export/types"
import { cn } from "@/shared/lib/utils"

const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; icon: LucideIcon; title: string }
> = {
  pdf: { label: REPORTS_LABELS.exportPdf, icon: FileText, title: "Descargar PDF" },
  csv: { label: REPORTS_LABELS.exportCsv, icon: Table2, title: "Descargar CSV" },
  xls: { label: REPORTS_LABELS.exportXls, icon: FileSpreadsheet, title: "Descargar XLS" },
}

const FORMATS: ExportFormat[] = ["pdf", "csv", "xls"]

type ReportExportButtonsProps = {
  accent: ReportAccent
  canExport: boolean
  onExport?: (format: ExportFormat) => void
}

export function ReportExportButtons({ accent, canExport, onExport }: ReportExportButtonsProps) {
  if (!canExport || !onExport) return null

  return (
    <div className="flex flex-col gap-1">
      <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em]", accentEyebrow[accent])}>
        {REPORTS_LABELS.exportGroup}
      </p>
      <div
        className={cn("inline-flex overflow-hidden", accentExportShell[accent])}
        role="group"
        aria-label={REPORTS_LABELS.exportGroup}
      >
        {FORMATS.map((format, index) => {
          const { label, icon: Icon, title } = FORMAT_CONFIG[format]
          return (
            <button
              key={format}
              type="button"
              title={title}
              onClick={() => onExport(format)}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-1.5 px-3 text-xs font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400/50",
                accentExportButton[accent],
                index === 0 && "rounded-l-lg",
                index === FORMATS.length - 1 && "rounded-r-lg",
                index > 0 && cn("border-l", accentExportDivider[accent]),
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
