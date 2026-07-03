import { Link } from "react-router-dom"
import { Save } from "lucide-react"

import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

export function FormSectionStep({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
      {n}
    </span>
  )
}

export const masterInputClassName = "h-10 rounded-lg"

export const masterTextareaClassName = cn(
  "flex min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm",
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-300",
)

export function inputErrorClass(hasError: boolean): string | null {
  return hasError ? "border-rose-300 focus-visible:ring-rose-500/20" : null
}

type MasterFormStickyFooterProps = {
  hint: string
  saving: boolean
  saveLabel: string
  savingLabel: string
  cancelLabel: string
  cancelHref: string
  disabled?: boolean
}

export function MasterFormStickyFooter({
  hint,
  saving,
  saveLabel,
  savingLabel,
  cancelLabel,
  cancelHref,
  disabled = false,
}: MasterFormStickyFooterProps) {
  return (
    <div className="sticky bottom-4 z-10 mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-5 py-4 text-center shadow-lg shadow-slate-200/50 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <p className="text-sm text-slate-500">{hint}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="submit" disabled={disabled || saving} className="gap-2">
          <Save className="h-4 w-4" aria-hidden />
          {saving ? savingLabel : saveLabel}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link to={cancelHref}>{cancelLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
