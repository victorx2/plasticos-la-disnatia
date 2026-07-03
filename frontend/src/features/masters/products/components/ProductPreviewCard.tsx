import { Barcode, Building2, Layers, Package } from "lucide-react"

import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import type { ProductFormState } from "@/features/masters/products/hooks/useProductForm"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"

type ClientOption = { id: number; name: string }

type ProductPreviewCardProps = {
  form: ProductFormState
  clients: ClientOption[]
}

export function ProductPreviewCard({ form, clients }: ProductPreviewCardProps) {
  const name = form.name.trim() || "Nuevo producto"
  const clientName =
    clients.find((c) => String(c.id) === form.clientId)?.name ?? "Sin cliente"
  const structure = form.structure.trim() || "—"
  const barcode = form.barcode.trim() || "—"

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        {PRODUCT_LABELS.preview.title}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <EntityAvatar name={name} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
            {clientName}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{PRODUCT_LABELS.fields.structure}</dt>
            <dd className="line-clamp-4 whitespace-pre-wrap text-slate-700">{structure}</dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Barcode className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{PRODUCT_LABELS.fields.barcode}</dt>
            <dd className="truncate font-mono text-xs text-slate-700">{barcode}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
        <Package className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600">{PRODUCT_LABELS.preview.hint}</p>
      </div>
    </aside>
  )
}
