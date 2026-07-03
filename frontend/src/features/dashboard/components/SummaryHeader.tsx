import { RefreshCw } from "lucide-react"

import { DASHBOARD_LABELS } from "@/features/dashboard/labels"
import { Button } from "@/shared/ui/button"

type SummaryHeaderProps = {
  loading: boolean
  generatedAt?: string
  onRefresh: () => void
}

function formatGeneratedAt(iso?: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export function SummaryHeader({ loading, generatedAt, onRefresh }: SummaryHeaderProps) {
  const updated = formatGeneratedAt(generatedAt)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-violet-700">{DASHBOARD_LABELS.sitePrefix}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{DASHBOARD_LABELS.pageTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">{DASHBOARD_LABELS.pageSubtitle}</p>
        {updated ? (
          <p className="mt-1 text-xs text-slate-500">Actualizado: {updated}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0"
        disabled={loading}
        onClick={onRefresh}
      >
        <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
        Actualizar
      </Button>
    </div>
  )
}
