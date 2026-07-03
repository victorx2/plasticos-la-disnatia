import type { ReactNode } from "react"

import { cn } from "@/shared/lib/utils"

export const productionSelectClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500"

export function SectionStep({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
      {n}
    </span>
  )
}

export function FormStickyFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex justify-end gap-2 border-t border-slate-200 bg-white/95 py-4 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  )
}
