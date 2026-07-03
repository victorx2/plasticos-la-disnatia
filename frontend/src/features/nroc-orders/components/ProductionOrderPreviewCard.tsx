import { Building2, Calendar, ClipboardList, Package, ScrollText } from "lucide-react"

import type { LineDraft } from "@/features/nroc-orders/hooks/useNrocOrderForm"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { Product } from "@/features/masters/products/types"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import { formatDateDMY } from "@/shared/format/dates"

type ProductionOrderPreviewCardProps = {
  clientName: string
  saleFor: string
  orderedAt: string
  notes: string
  lines: LineDraft[]
  products: Product[]
  batchCode?: string | null
}

function productLabel(products: Product[], productId: string): string {
  if (!productId) return "—"
  return products.find((p) => String(p.id) === productId)?.name ?? `Producto #${productId}`
}

function formatOrderedDate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return "—"
  return formatDateDMY(`${trimmed}T12:00:00`)
}

export function ProductionOrderPreviewCard({
  clientName,
  saleFor,
  orderedAt,
  notes,
  lines,
  products,
  batchCode,
}: ProductionOrderPreviewCardProps) {
  const displayClient = clientName.trim() || PRODUCTION_ORDER_LABELS.preview.noClient
  const displaySaleFor = saleFor.trim() || "—"
  const filledLines = lines.filter((line) => line.product_id.trim() || line.quantity.trim())

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        {PRODUCTION_ORDER_LABELS.preview.title}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <EntityAvatar name={displayClient} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{displayClient}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
            {displaySaleFor}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.fields.orderedAt}</dt>
            <dd className="text-slate-700">{formatOrderedDate(orderedAt)}</dd>
          </div>
        </div>

        {batchCode ? (
          <div className="flex items-start gap-2.5">
            <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.preview.batch}</dt>
              <dd className="font-mono text-xs text-slate-700">{batchCode}</dd>
            </div>
          </div>
        ) : null}

        <div className="flex items-start gap-2.5">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.linesTitle}</dt>
            <dd className="space-y-1 text-slate-700">
              {filledLines.length === 0 ? (
                <span className="text-slate-500">{PRODUCTION_ORDER_LABELS.preview.noLines}</span>
              ) : (
                filledLines.map((line) => (
                  <p key={line.key} className="truncate text-xs">
                    {productLabel(products, line.product_id)}
                    {line.quantity.trim() ? (
                      <span className="tabular-nums text-slate-500">
                        {" "}
                        · {line.quantity.trim()} {line.unit}
                      </span>
                    ) : null}
                  </p>
                ))
              )}
            </dd>
          </div>
        </div>

        {notes.trim() ? (
          <div className="flex items-start gap-2.5">
            <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.fields.notes}</dt>
              <dd className="line-clamp-3 whitespace-pre-wrap text-xs text-slate-700">{notes.trim()}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
        <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600">{PRODUCTION_ORDER_LABELS.preview.hint}</p>
      </div>
    </aside>
  )
}
