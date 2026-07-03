import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

export type StageTabWithCount = {
  id: string
  label: string
  count?: number
}

type StageTabsWithCountsProps = {
  tabs: StageTabWithCount[]
  value: string
  onChange: (id: string) => void
  className?: string
  trailing?: ReactNode
}

export function StageTabsWithCounts({
  tabs,
  value,
  onChange,
  className,
  trailing,
}: StageTabsWithCountsProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="inline-flex overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = value === tab.id
          const count = tab.count ?? 0
          return (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  isActive ? "bg-violet-200/60 text-violet-800" : "bg-slate-100 text-slate-500",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
      {trailing}
    </div>
  )
}
