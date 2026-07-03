import { Link } from "react-router-dom"

import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrder } from "@/features/nroc-orders/types"

type ProductionOrderPlantCellProps = {
  order: NrocOrder
}

export function ProductionOrderPlantCell({ order }: ProductionOrderPlantCellProps) {
  const worksCount = order.active_works_count ?? 0
  const awaitingSchedule = worksCount === 0 && order.status === "open"

  if (awaitingSchedule) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
          {PRODUCTION_ORDER_LABELS.awaitingScheduleBadge}
        </span>
        <Link to="/programacion" className="text-xs font-medium text-violet-700 hover:underline">
          {PRODUCTION_ORDER_LABELS.scheduleLink}
        </Link>
      </div>
    )
  }

  if (worksCount > 0) {
    return (
      <span className="inline-flex rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
        {PRODUCTION_ORDER_LABELS.hasWorks(worksCount)}
      </span>
    )
  }

  return <span className="text-slate-400">{PRODUCTION_ORDER_LABELS.noWorks}</span>
}
