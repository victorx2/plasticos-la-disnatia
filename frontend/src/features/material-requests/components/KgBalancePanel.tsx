import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"
import { MATERIAL_REQUEST_LABELS } from "@/features/material-requests/labels"

type KgBalanceProps = {
  kgAuthorized?: string | number | null
  kgDispatched?: string | number | null
  kgRemaining?: string | number | null
  previewTotalKg?: number | null
}

export function KgBalancePanel({
  kgAuthorized,
  kgDispatched,
  kgRemaining,
  previewTotalKg,
}: KgBalanceProps) {
  const authorized =
    kgAuthorized != null && kgAuthorized !== ""
      ? parseKgNumber(String(kgAuthorized))
      : previewTotalKg ?? null
  const dispatched =
    kgDispatched != null && kgDispatched !== "" ? parseKgNumber(String(kgDispatched)) : 0
  const remaining =
    kgRemaining != null && kgRemaining !== ""
      ? parseKgNumber(String(kgRemaining))
      : authorized != null
        ? Math.max(0, authorized - dispatched)
        : null

  if (authorized == null && remaining == null) return null

  return (
    <div className="grid gap-3 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 sm:grid-cols-3">
      <div>
        <p className="text-xs font-medium text-slate-500">{MATERIAL_REQUEST_LABELS.kg.authorized}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900">
          {authorized != null ? formatKgDisplay(authorized) : "—"}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{MATERIAL_REQUEST_LABELS.kg.dispatched}</p>
        <p className="text-lg font-semibold tabular-nums text-slate-900">
          {formatKgDisplay(dispatched)}
        </p>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{MATERIAL_REQUEST_LABELS.kg.remaining}</p>
        <p className="text-lg font-semibold tabular-nums text-emerald-800">
          {remaining != null ? formatKgDisplay(remaining) : "—"}
        </p>
      </div>
      {previewTotalKg != null && kgAuthorized == null ? (
        <p className="text-xs text-slate-600 sm:col-span-3">{MATERIAL_REQUEST_LABELS.kg.previewHint}</p>
      ) : null}
      {kgAuthorized != null ? (
        <p className="text-xs text-slate-600 sm:col-span-3">{MATERIAL_REQUEST_LABELS.kg.dispatchHint}</p>
      ) : null}
    </div>
  )
}
