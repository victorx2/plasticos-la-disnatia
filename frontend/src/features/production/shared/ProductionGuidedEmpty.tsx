import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { Check } from "lucide-react"

import {
  PRODUCTION_FLOW_LABELS,
  type ProductionFlowStepItem,
} from "@/features/production/shared/labels"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { cn } from "@/shared/lib/utils"

type ProductionGuidedEmptyProps = {
  icon: LucideIcon
  title: string
  description?: string
  steps?: ProductionFlowStepItem[]
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  compact?: boolean
  className?: string
}

export function ProductionGuidedEmpty({
  icon,
  title,
  description,
  steps,
  primaryAction,
  secondaryAction,
  compact = true,
  className,
}: ProductionGuidedEmptyProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <CatalogEmptyState
        compact={compact}
        icon={icon}
        title={title}
        description={description}
        action={primaryAction}
      />
      {steps && steps.length > 0 ? (
        <div className="mx-auto max-w-sm rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3 text-left">
          <p className="text-xs font-medium text-slate-600">{PRODUCTION_FLOW_LABELS.emptyStepsTitle}</p>
          <ol className="mt-2 space-y-1.5">
            {steps.map((step, index) => (
              <li key={`${step.label}-${index}`} className="flex items-start gap-2 text-sm">
                {step.done ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                    {index + 1}
                  </span>
                )}
                {step.href && !step.done ? (
                  <Link to={step.href} className="text-violet-700 underline-offset-2 hover:underline">
                    {step.label}
                  </Link>
                ) : (
                  <span className={cn(step.done ? "text-slate-500 line-through" : "text-slate-700")}>
                    {step.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {secondaryAction ? <div className="flex justify-center">{secondaryAction}</div> : null}
    </div>
  )
}
