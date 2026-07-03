import { Phone, User } from "lucide-react"

import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import type { VendorFormState } from "@/features/masters/vendors/hooks/useVendorForm"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"

type VendorPreviewCardProps = {
  form: VendorFormState
  photoPreviewSrc?: string
}

function previewPhone(value: string): string {
  const trimmed = value.trim()
  return trimmed.length > 22 ? `${trimmed.slice(0, 22)}…` : trimmed || "—"
}

export function VendorPreviewCard({ form, photoPreviewSrc }: VendorPreviewCardProps) {
  const name = form.name.trim() || "Nuevo vendedor"

  return (
    <aside className="rounded-xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-slate-50 p-5 shadow-sm lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600/80">
        {VENDOR_LABELS.preview.title}
      </p>

      <div className="mt-4 flex items-start gap-3">
        <EntityAvatar name={name} photoUrl={photoPreviewSrc} size="md" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{name}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{VENDOR_LABELS.fields.phonePrimary}</dt>
            <dd className="break-all text-slate-700">{previewPhone(form.phonePrimary)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-violet-500/70" aria-hidden />
          <div>
            <dt className="text-xs text-slate-500">{VENDOR_LABELS.fields.phoneSecondary}</dt>
            <dd className="break-all text-slate-700">{previewPhone(form.phoneSecondary)}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex items-start gap-2 rounded-lg border border-violet-100 bg-white/70 px-3 py-2.5">
        <User className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
        <p className="text-xs leading-relaxed text-slate-600">{VENDOR_LABELS.preview.hint}</p>
      </div>
    </aside>
  )
}
