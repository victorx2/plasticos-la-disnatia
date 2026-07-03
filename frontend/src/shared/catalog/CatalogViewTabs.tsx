import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type CatalogViewTab = {
  id: string
  label: string
  icon?: LucideIcon
}

type CatalogViewTabsProps = {
  tabs: CatalogViewTab[]
  value: string
  onChange: (id: string) => void
  className?: string
  trailing?: ReactNode
}

export function CatalogViewTabs({
  tabs,
  value,
  onChange,
  className,
  trailing,
}: CatalogViewTabsProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                value === tab.id
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
              onClick={() => onChange(tab.id)}
            >
              {TabIcon ? (
                <TabIcon
                  className={cn(
                    "h-3.5 w-3.5",
                    value === tab.id ? "text-violet-700" : "text-slate-400",
                  )}
                  aria-hidden
                />
              ) : null}
              {tab.label}
            </button>
          )
        })}
      </div>
      {trailing}
    </div>
  )
}
