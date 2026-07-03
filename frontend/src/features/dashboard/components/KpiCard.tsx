import {
  Bell,
  Boxes,
  Factory,
  FlaskConical,
  Inbox,
  PackageX,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { Link } from "react-router-dom"

import type { DashboardKpi, DashboardKpiTone } from "@/features/dashboard/types"
import { cn } from "@/shared/lib/utils"

const ICONS: Record<DashboardKpi["iconName"], LucideIcon> = {
  flask: FlaskConical,
  factory: Factory,
  bell: Bell,
  trending: TrendingUp,
  inbox: Inbox,
  "package-x": PackageX,
  boxes: Boxes,
}

const TONE_STYLES: Record<DashboardKpiTone, string> = {
  neutral: "border-slate-200/80 bg-white/80",
  attention: "border-amber-200/80 bg-amber-50/60",
  critical: "border-rose-200/80 bg-rose-50/60",
}

const BADGE_STYLES: Record<DashboardKpiTone, string> = {
  neutral: "",
  attention: "bg-amber-100 text-amber-800",
  critical: "bg-rose-100 text-rose-800",
}

type KpiCardProps = {
  kpi: DashboardKpi
}

export function KpiCard({ kpi }: KpiCardProps) {
  const Icon = ICONS[kpi.iconName]

  const body = (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border p-4 transition-colors",
        TONE_STYLES[kpi.tone],
        kpi.href && "hover:border-violet-200 hover:bg-violet-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {kpi.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {kpi.badge ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                BADGE_STYLES[kpi.tone],
              )}
            >
              {kpi.badge}
            </span>
          ) : null}
          <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
        </div>
      </div>

      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
        {kpi.displayValue}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-500">{kpi.hint}</p>
    </article>
  )

  if (kpi.href) {
    return (
      <Link
        to={kpi.href}
        className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
      >
        {body}
      </Link>
    )
  }

  return body
}
