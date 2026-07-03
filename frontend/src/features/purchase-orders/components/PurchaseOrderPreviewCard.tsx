import { Calendar, Hash, Package, ShoppingCart, Truck } from "lucide-react"

import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import type { PurchaseOrderFormState } from "@/features/purchase-orders/hooks/usePurchaseOrderForm"

type SupplierOption = { id: number; name: string }

type PurchaseOrderPreviewCardProps = {
  form: PurchaseOrderFormState
  suppliers: SupplierOption[]
}

export function PurchaseOrderPreviewCard({ form, suppliers }: PurchaseOrderPreviewCardProps) {
  const supplierName =
    suppliers.find((s) => String(s.id) === form.supplier_id)?.name ?? "Sin proveedor"
  const lineCount = form.lines.filter((line) => line.quantity_ordered.trim()).length

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        {PURCHASE_ORDER_LABELS.preview.title}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <ShoppingCart className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate font-mono text-base font-semibold text-slate-900">
            {form.code.trim() || "OC-…"}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-600">
            <Truck className="h-3.5 w-3.5 shrink-0 text-violet-500/70" aria-hidden />
            {supplierName}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{PURCHASE_ORDER_LABELS.fields.orderedAt}</dt>
            <dd className="text-slate-700">{form.ordered_at || "—"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{PURCHASE_ORDER_LABELS.fields.lines}</dt>
            <dd className="text-slate-700">
              {lineCount} {lineCount === 1 ? "línea" : "líneas"}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Hash className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{PURCHASE_ORDER_LABELS.fields.taxApplies}</dt>
            <dd className="text-slate-700">{form.tax_applies ? "Sí" : "No"}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
        <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600">{PURCHASE_ORDER_LABELS.preview.hint}</p>
      </div>
    </aside>
  )
}
