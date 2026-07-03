import { Link, useParams } from "react-router-dom"
import { Package } from "lucide-react"

import { KgBalancePanel } from "@/features/material-requests/components/KgBalancePanel"
import {
  MATERIAL_REQUEST_LABELS,
  materialRequestStatusLabel,
} from "@/features/material-requests/labels"
import { useMaterialRequestReview } from "@/features/material-requests/hooks/useMaterialRequestReview"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

function RequestLinesTable({
  title,
  lines,
}: {
  title: string
  lines: Array<{
    description?: string | null
    quantity_requested: string | number
    unit?: string | null
    material?: { sku: string; name: string } | null
  }>
}) {
  if (!lines.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">Sin ítems.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="space-y-2 text-sm">
        {lines.map((line, index) => {
          const desc =
            line.description?.trim() ||
            (line.material ? `${line.material.sku} · ${line.material.name}` : `Ítem ${index + 1}`)
          return (
            <li key={index} className="flex justify-between gap-4 border-b border-slate-200/80 pb-2 last:border-0">
              <span className="text-slate-800">{desc}</span>
              <span className="shrink-0 tabular-nums text-slate-600">
                {line.quantity_requested} {line.unit ?? "kg"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function MaterialRequestReviewPage() {
  const { id } = useParams()
  const materialRequestId = id ? Number(id) : null
  const validId =
    Number.isFinite(materialRequestId) && materialRequestId! > 0 ? materialRequestId : null

  const {
    detail,
    loading,
    isCounterPending,
    accepting,
    rejecting,
    acceptCounter,
    rejectCounter,
  } = useMaterialRequestReview(validId)

  if (!validId) {
    return (
      <PageShell title={MATERIAL_REQUEST_LABELS.reviewTitle} icon={Package}>
        <p className="text-sm text-slate-500">ID inválido.</p>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell
        title={MATERIAL_REQUEST_LABELS.reviewTitle}
        subtitle={MATERIAL_REQUEST_LABELS.reviewSubtitle}
        icon={Package}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  if (!detail) {
    return (
      <PageShell title={MATERIAL_REQUEST_LABELS.reviewTitle} icon={Package}>
        <p className="text-sm text-slate-500">{MATERIAL_REQUEST_LABELS.review.loadError}</p>
        <Button type="button" variant="outline" className="mt-4" asChild>
          <Link to="/solicitudes-area">{MATERIAL_REQUEST_LABELS.review.back}</Link>
        </Button>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${MATERIAL_REQUEST_LABELS.reviewTitle} #${detail.id}`}
      subtitle={MATERIAL_REQUEST_LABELS.reviewSubtitle}
      icon={Package}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/solicitudes-area">{MATERIAL_REQUEST_LABELS.review.back}</Link>
        </Button>
      }
    >
      <div className="max-w-3xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm space-y-2">
          <p>
            <span className="text-slate-500">Estado: </span>
            <span className="font-medium">{materialRequestStatusLabel(detail.status)}</span>
          </p>
          {detail.work_order?.code || detail.work_order_id ? (
            <p>
              <span className="text-slate-500">Trabajo en planta: </span>
              {detail.work_order?.code ?? detail.work_order_id}
            </p>
          ) : null}
          {detail.notes ? (
            <p>
              <span className="text-slate-500">Observaciones: </span>
              {detail.notes}
            </p>
          ) : null}
        </div>

        <KgBalancePanel
          kgAuthorized={detail.kg_authorized}
          kgDispatched={detail.kg_dispatched}
          kgRemaining={detail.kg_remaining}
        />

        {detail.rejection_reason ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-medium text-amber-900">
              {MATERIAL_REQUEST_LABELS.review.rejectionReason}
            </p>
            <p className="mt-1 text-sm text-amber-950">{detail.rejection_reason}</p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <RequestLinesTable
            title={MATERIAL_REQUEST_LABELS.review.originalLines}
            lines={detail.lines ?? []}
          />
          <RequestLinesTable
            title={MATERIAL_REQUEST_LABELS.review.counterLines}
            lines={detail.counter_proposal_lines ?? []}
          />
        </div>

        {isCounterPending ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={accepting} onClick={() => void acceptCounter()}>
              {accepting ? MATERIAL_REQUEST_LABELS.review.accepting : MATERIAL_REQUEST_LABELS.review.accept}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-rose-700"
              disabled={rejecting}
              onClick={() => void rejectCounter()}
            >
              {rejecting ? MATERIAL_REQUEST_LABELS.review.rejecting : MATERIAL_REQUEST_LABELS.review.reject}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{MATERIAL_REQUEST_LABELS.review.notCounter}</p>
        )}
      </div>
    </PageShell>
  )
}
