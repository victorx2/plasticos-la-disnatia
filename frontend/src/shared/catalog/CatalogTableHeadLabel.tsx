import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

type CatalogTableHeadLabelProps = {
  icon: LucideIcon
  iconClassName?: string
  children: ReactNode
}

export function CatalogTableHeadLabel({
  icon: Icon,
  iconClassName,
  children,
}: CatalogTableHeadLabelProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className={cn("h-3.5 w-3.5", iconClassName ?? "text-slate-400")} aria-hidden />
      {children}
    </span>
  )
}
