import { Link2, Mail, MapPin, Phone, User } from "lucide-react"

import { ClientAvatar } from "@/features/masters/clients/components/ClientAvatar"
import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import type { ClientFormState } from "@/features/masters/clients/hooks/useClientForm"
import { buildRifValue } from "@/features/masters/shared/rif"
import { formatLocation } from "@/features/masters/clients/display"

type ClientPreviewCardProps = {
  form: ClientFormState
  photoPreviewSrc?: string
}

export function ClientPreviewCard({ form, photoPreviewSrc }: ClientPreviewCardProps) {
  const name = form.name.trim() || "Nuevo cliente"
  const rif = form.noRif ? null : buildRifValue(form) || null
  const location = formatLocation(form.state, form.city)
  const email = form.email.trim()
  const phone = form.phone.trim()
  const vendorLabel = form.vendorId
    ? form.vendorName.trim() || `Vendedor #${form.vendorId}`
    : CLIENT_LABELS.vendorNone

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        Vista previa
      </p>

      <div className="mt-4 flex items-start gap-3">
        <ClientAvatar name={name} size="md" photoUrl={photoPreviewSrc} />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">
            {rif ?? "Sin RIF"}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{CLIENT_LABELS.fields.vendor}</dt>
            <dd className="text-slate-700">{vendorLabel}</dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{CLIENT_LABELS.sections.location}</dt>
            <dd className="text-slate-700">{location}</dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div className="min-w-0">
            <dt className="text-xs text-slate-500">{CLIENT_LABELS.fields.email}</dt>
            <dd className="truncate text-slate-700">{email || "—"}</dd>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{CLIENT_LABELS.fields.phone}</dt>
            <dd className="text-slate-700">{phone || "—"}</dd>
          </div>
        </div>

        {form.address.trim() ? (
          <div className="flex items-start gap-2.5">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
            <div>
              <dt className="text-xs text-slate-500">{CLIENT_LABELS.fields.address}</dt>
              <dd className="line-clamp-3 text-slate-700">{form.address.trim()}</dd>
            </div>
          </div>
        ) : null}
      </dl>
    </aside>
  )
}
