import type { ReactNode } from "react"

import type { DashboardKpiGroup } from "@/features/dashboard/types"
import { cn } from "@/shared/lib/utils"

type SummaryKpiSectionProps = {
  title: string
  variant: DashboardKpiGroup
  children: ReactNode
}

const VARIANT_STYLES: Record<DashboardKpiGroup, string> = {
  production:
    "border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50",
  inventory: "border-slate-200/80 bg-slate-50/50",
  action: "border-slate-200/80 bg-slate-50/50",
}

export function SummaryKpiSection({ title, variant, children }: SummaryKpiSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-lg border p-4 sm:p-5",
        VARIANT_STYLES[variant],
      )}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      <div className="grid flex-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  )
}
