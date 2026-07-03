import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

import "@/shared/catalog/CatalogDataTable.css"

type ProductionSectionPanelProps = {
  title?: string
  meta?: ReactNode
  highlight?: boolean
  minHeight?: string
  children: ReactNode
  className?: string
}

export function ProductionSectionPanel({
  title,
  meta,
  highlight,
  minHeight = "200px",
  children,
  className,
}: ProductionSectionPanelProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          {meta}
        </div>
      ) : null}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm",
          highlight && "ring-1 ring-amber-200/60",
        )}
      >
        <div className="catalog-data-table relative overflow-x-auto" style={{ minHeight }}>
          {children}
        </div>
      </div>
    </section>
  )
}
