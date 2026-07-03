import { Info } from "lucide-react"

import { CATALOG_LABELS } from "@/shared/catalog/labels"

export function CatalogSearchHint() {
  return (
    <p className="-mt-2 flex items-start gap-1.5 text-xs text-slate-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
      {CATALOG_LABELS.searchHint}
    </p>
  )
}
