import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import {
  PRODUCTION_FLOW_LABELS,
  type ProductionFlowStep,
} from "@/features/production/shared/labels"
import { useWorkProductionResume } from "@/features/production/shared/useWorkProductionResume"
import { resolveProductionStepHref } from "@/features/production/shared/workProductionResume"
import { cn } from "@/shared/lib/utils"

const FLOW_STEPS: ProductionFlowStep[] = [
  "orden",
  "programacion",
  "mezcla",
  "extrusion",
  "sellado",
]

const STEP_INDEX: Record<ProductionFlowStep, number> = {
  orden: 0,
  programacion: 1,
  mezcla: 2,
  extrusion: 3,
  sellado: 4,
}

type ProductionFlowStripProps = {
  activeStep: ProductionFlowStep
  /** Si se indica, los enlaces de mezcla/extrusión apuntan al trabajo y reanudan sesión activa. */
  workOrderId?: number | null
  className?: string
}

export function ProductionFlowStrip({ activeStep, workOrderId, className }: ProductionFlowStripProps) {
  const activeIndex = STEP_INDEX[activeStep]
  const { resume, loading: resumeLoading } = useWorkProductionResume(workOrderId)
  const resumeForLinks = resumeLoading ? null : resume

  return (
    <nav
      aria-label="Flujo de producción"
      className={cn(
        "overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm",
        className,
      )}
    >
      <ol className="flex min-w-max items-center gap-1">
        {FLOW_STEPS.map((step, index) => {
          const isActive = step === activeStep
          const isPast = index < activeIndex
          const isFuture = index > activeIndex
          const label = PRODUCTION_FLOW_LABELS.steps[step]
          const href = resolveProductionStepHref(step, workOrderId, resumeForLinks)

          const content = (
            <>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive && "bg-violet-600 text-white",
                  isPast && "bg-violet-100 text-violet-700",
                  isFuture && "bg-slate-100 text-slate-400",
                )}
              >
                {index + 1}
              </span>
              <span className="whitespace-nowrap">{label}</span>
            </>
          )

          return (
            <li key={step} className="flex items-center gap-1">
              {isActive ? (
                <span
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-800 ring-1 ring-violet-200"
                  aria-current="step"
                >
                  {content}
                </span>
              ) : (
                <Link
                  to={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    isPast && "text-violet-700 hover:bg-violet-50",
                    isFuture && "text-slate-400 hover:bg-slate-50 hover:text-slate-600",
                  )}
                >
                  {content}
                </Link>
              )}
              {index < FLOW_STEPS.length - 1 ? (
                <ChevronRight
                  className={cn("h-3.5 w-3.5 shrink-0", isFuture ? "text-slate-300" : "text-slate-400")}
                  aria-hidden
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
