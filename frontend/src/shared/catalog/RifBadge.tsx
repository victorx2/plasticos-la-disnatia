import { hasRif } from "@/shared/catalog/entityDisplay"

type RifBadgeProps = {
  rif: string | null | undefined
}

export function RifBadge({ rif }: RifBadgeProps) {
  if (!hasRif(rif)) {
    return (
      <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        Sin RIF
      </span>
    )
  }

  return (
    <span className="inline-flex rounded-md bg-slate-900/5 px-2 py-0.5 font-mono text-xs font-medium text-slate-800 ring-1 ring-slate-200/80">
      {rif!.trim()}
    </span>
  )
}
