import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

type CatalogEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function CatalogEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: CatalogEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-10" : "px-6 py-14",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 via-violet-500/8 to-violet-400/10 ring-1 ring-violet-500/20 shadow-sm",
          compact ? "h-14 w-14" : "h-16 w-16",
        )}
      >
        <Icon className={cn("text-violet-600", compact ? "h-7 w-7" : "h-8 w-8")} aria-hidden />
      </div>
      <p className="text-base font-semibold tracking-tight text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
