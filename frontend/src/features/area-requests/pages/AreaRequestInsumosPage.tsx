import { Link, useParams } from "react-router-dom"
import { ClipboardList, Plus, Trash2 } from "lucide-react"

import { areaLabel } from "@/features/area-requests/areas"
import { AREA_REQUEST_LABELS } from "@/features/area-requests/labels"
import { useAreaRequestInsumos } from "@/features/area-requests/hooks/useAreaRequestInsumos"
import { useMaterialOptions } from "@/features/materials/hooks/useMaterialOptions"
import { KgBalancePanel } from "@/features/material-requests/components/KgBalancePanel"
import { materialRequestStatusLabel, MATERIAL_REQUEST_LABELS } from "@/features/material-requests/labels"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

export function AreaRequestInsumosPage() {
  const { id } = useParams()
  const materialRequestId = id ? Number(id) : null
  const validId =
    Number.isFinite(materialRequestId) && materialRequestId! > 0 ? materialRequestId : null

  const { materials, loading: loadingMaterials } = useMaterialOptions()
  const {
    detail,
    lines,
    loading,
    dispatching,
    receiving,
    rejecting,
    closing,
    canDispatch,
    canReceive,
    isInbound,
    canReject,
    canClose,
    isCounterPending,
    rejectReason,
    setRejectReason,
    useCounterProposal,
    setUseCounterProposal,
    counterLines,
    patchCounterLine,
    addCounterLine,
    removeCounterLine,
    patchLine,
    submitDispatch,
    submitReceive,
    submitReject,
    submitClose,
    unitOptions,
  } = useAreaRequestInsumos(validId)

  async function handleDispatch(event: React.FormEvent) {
    event.preventDefault()
    await submitDispatch()
  }

  async function handleReceive() {
    await submitReceive()
  }

  async function handleReject(event: React.FormEvent) {
    event.preventDefault()
    await submitReject()
  }

  if (!validId) {
    return (
      <PageShell title={AREA_REQUEST_LABELS.insumosTitle} icon={ClipboardList}>
        <p className="text-sm text-slate-500">ID inválido.</p>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell
        title={AREA_REQUEST_LABELS.insumosTitle}
        subtitle={AREA_REQUEST_LABELS.insumosSubtitle}
        icon={ClipboardList}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  if (!detail) {
    return (
      <PageShell title={AREA_REQUEST_LABELS.insumosTitle} icon={ClipboardList}>
        <p className="text-sm text-slate-500">No se encontró la solicitud.</p>
        <Button type="button" variant="outline" className="mt-4" asChild>
          <Link to="/solicitudes-area">{AREA_REQUEST_LABELS.back}</Link>
        </Button>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={`${AREA_REQUEST_LABELS.insumosTitle} #${detail.id}`}
      subtitle={AREA_REQUEST_LABELS.insumosSubtitle}
      icon={ClipboardList}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/solicitudes-area">{AREA_REQUEST_LABELS.back}</Link>
        </Button>
      }
    >
      <div className="max-w-3xl space-y-6">
        <div className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-950 space-y-2">
          <p className="font-medium">{MATERIAL_REQUEST_LABELS.helpWarehouseTitle}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {MATERIAL_REQUEST_LABELS.helpWarehouseSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm space-y-2">
          <p>
            <span className="text-slate-500">{AREA_REQUEST_LABELS.fields.status}: </span>
            <span className="font-medium">{materialRequestStatusLabel(detail.status)}</span>
          </p>
          {detail.work_order?.code || detail.work_order_id ? (
            <p>
              <span className="text-slate-500">{AREA_REQUEST_LABELS.fields.workOrder}: </span>
              {detail.work_order?.code ?? detail.work_order_id}
            </p>
          ) : null}
          {detail.originating_area ? (
            <p>
              <span className="text-slate-500">{AREA_REQUEST_LABELS.fields.originatingArea}: </span>
              {areaLabel(detail.originating_area)}
            </p>
          ) : null}
          <p>
            <span className="text-slate-500">{AREA_REQUEST_LABELS.fields.requester}: </span>
            {detail.requester?.name ?? "—"}
          </p>
          {detail.notes ? (
            <p>
              <span className="text-slate-500">{AREA_REQUEST_LABELS.fields.notes}: </span>
              {detail.notes}
            </p>
          ) : null}
        </div>

        <KgBalancePanel
          kgAuthorized={detail.kg_authorized}
          kgDispatched={detail.kg_dispatched}
          kgRemaining={detail.kg_remaining}
        />

        {canClose ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-sm text-slate-700">
              Cuando producción termine de retirar material parcialmente, cierre la solicitud para liberar el cupo.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={closing}
              onClick={() => void submitClose()}
            >
              {closing ? AREA_REQUEST_LABELS.closing : AREA_REQUEST_LABELS.closeRequest}
            </Button>
          </div>
        ) : null}

        {isCounterPending ? (
          <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 text-sm space-y-2">
            <p className="font-medium text-violet-900">{AREA_REQUEST_LABELS.counterPendingTitle}</p>
            <p className="text-violet-800">{AREA_REQUEST_LABELS.counterPendingHint}</p>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to={`/solicitudes-material/revision/${detail.id}`}>
                {AREA_REQUEST_LABELS.reviewCounter}
              </Link>
            </Button>
          </div>
        ) : null}

        {detail.rejection_reason && !isCounterPending ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm">
            <p className="text-xs font-medium text-amber-900">{AREA_REQUEST_LABELS.fields.rejectionReason}</p>
            <p className="mt-1 text-amber-950">{detail.rejection_reason}</p>
          </div>
        ) : null}

        {isInbound ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 text-sm space-y-2">
            <p className="font-medium text-emerald-900">{AREA_REQUEST_LABELS.inboundTitle}</p>
            <p className="text-emerald-800">{AREA_REQUEST_LABELS.inboundHint}</p>
            {(detail.lines ?? []).map((line, index) => (
              <p key={line.id ?? index}>
                {line.description}: {line.quantity_requested} {line.unit ?? "kg"}
              </p>
            ))}
            {canReceive ? (
              <Button type="button" disabled={receiving} onClick={() => void handleReceive()}>
                {receiving ? AREA_REQUEST_LABELS.receiving : AREA_REQUEST_LABELS.receive}
              </Button>
            ) : null}
          </div>
        ) : (
        <form
          onSubmit={(e) => void handleDispatch(e)}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {lines.length === 0 ? (
            <p className="text-sm text-slate-500">
              {canDispatch
                ? AREA_REQUEST_LABELS.noPendingLines
                : AREA_REQUEST_LABELS.noLinesToDispatch}
            </p>
          ) : (
            lines.map((line) => (
              <div
                key={line.key}
                className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <p className="text-sm font-medium text-slate-900">{line.description}</p>
                <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-3">
                  <span>
                    {AREA_REQUEST_LABELS.fields.requested}: {line.quantity_requested} {line.unit}
                  </span>
                  <span>
                    {AREA_REQUEST_LABELS.fields.dispatched}: {line.quantity_dispatched} {line.unit}
                  </span>
                  <span>
                    {AREA_REQUEST_LABELS.fields.toDispatch}: {line.pending.toFixed(3)} {line.unit}
                  </span>
                </div>
                <LabeledField
                  htmlFor={`dispatch-qty-${line.key}`}
                  label={AREA_REQUEST_LABELS.fields.toDispatch}
                >
                  <Input
                    id={`dispatch-qty-${line.key}`}
                    inputMode="decimal"
                    value={line.quantity}
                    disabled={!canDispatch}
                    onChange={(e) => patchLine(line.key, e.target.value)}
                  />
                </LabeledField>
              </div>
            ))
          )}

          {canDispatch ? (
            <>
              <p className="text-sm text-sky-900 rounded-lg border border-sky-200 bg-sky-50/60 p-3">
                {AREA_REQUEST_LABELS.dispatchMixtureHint}
              </p>
              <Button type="submit" disabled={dispatching}>
                {dispatching ? AREA_REQUEST_LABELS.dispatching : AREA_REQUEST_LABELS.dispatch}
              </Button>
            </>
          ) : null}
        </form>
        )}

        {canReject ? (
          <form
            onSubmit={(e) => void handleReject(e)}
            className="space-y-4 rounded-xl border border-rose-200 bg-rose-50/20 p-6 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-slate-900">{AREA_REQUEST_LABELS.rejectTitle}</h3>
            <p className="text-xs text-slate-600">{AREA_REQUEST_LABELS.rejectHint}</p>

            <LabeledField htmlFor="reject-reason" label={AREA_REQUEST_LABELS.fields.rejectionReason}>
              <textarea
                id="reject-reason"
                className="flex min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={rejectReason}
                required
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </LabeledField>

            <div className="flex items-center gap-2">
              <input
                id="use-counter"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={useCounterProposal}
                onChange={(e) => setUseCounterProposal(e.target.checked)}
              />
              <Label htmlFor="use-counter" className="text-sm font-normal">
                {AREA_REQUEST_LABELS.proposeCounter}
              </Label>
            </div>

            {useCounterProposal ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">{AREA_REQUEST_LABELS.counterLinesTitle}</p>
                  <Button type="button" variant="outline" size="sm" onClick={addCounterLine}>
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {AREA_REQUEST_LABELS.addCounterLine}
                  </Button>
                </div>

                {counterLines.map((line, index) => (
                  <div
                    key={line.key}
                    className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">Ítem {index + 1}</span>
                      {counterLines.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => removeCounterLine(line.key)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {AREA_REQUEST_LABELS.removeCounterLine}
                        </Button>
                      ) : null}
                    </div>

                    <LabeledField htmlFor={`counter-mat-${line.key}`} label={AREA_REQUEST_LABELS.fields.material}>
                      <select
                        id={`counter-mat-${line.key}`}
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        value={line.material_id}
                        disabled={loadingMaterials}
                        onChange={(e) => {
                          const mat = materials.find((m) => String(m.id) === e.target.value)
                          patchCounterLine(line.key, {
                            material_id: e.target.value,
                            description: mat ? `${mat.sku} · ${mat.name}` : line.description,
                            unit: mat?.unit ?? line.unit,
                          })
                        }}
                      >
                        <option value="">Sin material (solo descripción)</option>
                        {materials.map((material) => (
                          <option key={material.id} value={String(material.id)}>
                            {material.sku} · {material.name}
                          </option>
                        ))}
                      </select>
                    </LabeledField>

                    <LabeledField htmlFor={`counter-desc-${line.key}`} label={AREA_REQUEST_LABELS.fields.description}>
                      <Input
                        id={`counter-desc-${line.key}`}
                        value={line.description}
                        required
                        onChange={(e) => patchCounterLine(line.key, { description: e.target.value })}
                      />
                    </LabeledField>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <LabeledField htmlFor={`counter-qty-${line.key}`} label={AREA_REQUEST_LABELS.fields.requested}>
                        <Input
                          id={`counter-qty-${line.key}`}
                          inputMode="decimal"
                          value={line.quantity_requested}
                          required
                          onChange={(e) =>
                            patchCounterLine(line.key, { quantity_requested: e.target.value })
                          }
                        />
                      </LabeledField>

                      <LabeledField htmlFor={`counter-unit-${line.key}`} label={AREA_REQUEST_LABELS.fields.unit}>
                        <select
                          id={`counter-unit-${line.key}`}
                          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          value={line.unit}
                          onChange={(e) => patchCounterLine(line.key, { unit: e.target.value })}
                        >
                          {unitOptions.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </LabeledField>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <Button type="submit" variant="destructive" disabled={rejecting}>
              {rejecting ? AREA_REQUEST_LABELS.rejecting : AREA_REQUEST_LABELS.reject}
            </Button>
          </form>
        ) : null}

        <p className="text-xs text-slate-500">
          La salida quedará registrada en{" "}
          <Link className="text-violet-700 underline" to="/movimientos-inventario">
            Movimientos de inventario
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
