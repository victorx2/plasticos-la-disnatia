import { Mail, MapPin, Phone, Truck } from "lucide-react"

import { buildRifValue } from "@/features/masters/shared/rif"
import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import type { SupplierFormState } from "@/features/masters/suppliers/hooks/useSupplierForm"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"

type SupplierPreviewCardProps = {
  form: SupplierFormState
  photoPreviewSrc?: string
}

export function SupplierPreviewCard({ form, photoPreviewSrc }: SupplierPreviewCardProps) {
  const name = form.name.trim() || "Nuevo proveedor"
  const rif = form.noRif ? "Sin RIF" : buildRifValue(form) || "—"

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        {SUPPLIER_LABELS.preview.title}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <EntityAvatar name={name} photoUrl={photoPreviewSrc} size="md" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">{rif}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{SUPPLIER_LABELS.fields.email}</dt>
            <dd className="truncate text-slate-700">{form.email.trim() || "—"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{SUPPLIER_LABELS.fields.phone}</dt>
            <dd className="text-slate-700">{form.phone.trim() || "—"}</dd>
          </div>
        </div>
        {form.address.trim() ? (
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
            <div>
              <dt className="text-xs text-slate-500">{SUPPLIER_LABELS.fields.address}</dt>
              <dd className="line-clamp-3 text-slate-700">{form.address.trim()}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600">{SUPPLIER_LABELS.preview.hint}</p>
      </div>
    </aside>
  )
}
