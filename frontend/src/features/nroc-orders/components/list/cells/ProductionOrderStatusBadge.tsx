import { productionOrderStatusLabel } from "@/features/nroc-orders/labels"
import { cn } from "@/shared/lib/utils"

const STATUS_DOT: Record<string, string> = {
  open: "bg-emerald-500",
  fulfilled: "bg-slate-400",
  cancelled: "bg-rose-500",
}

type ProductionOrderStatusBadgeProps = {
  status: string
}

export function ProductionOrderStatusBadge({ status }: ProductionOrderStatusBadgeProps) {
  const label = productionOrderStatusLabel(status)
  const dot = STATUS_DOT[status] ?? "bg-slate-300"

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  )
}
