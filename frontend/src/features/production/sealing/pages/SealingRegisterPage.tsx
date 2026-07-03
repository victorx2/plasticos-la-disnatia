import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Scissors } from "lucide-react"

import { useSealingRegisterForm } from "@/features/production/sealing/hooks/useSealingRegisterForm"
import { SEALING_LABELS, sealingShiftLabel } from "@/features/production/sealing/labels"
import { SEALING_SHIFTS } from "@/features/production/sealing/types"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import {
  FormStickyFooter,
  productionSelectClassName,
  SectionStep,
} from "@/features/production/shared/formUi"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function formatTimerDisplay(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  return `${m}:${String(s).padStart(2, "0")}`
}

function workOptionLabel(work: {
  code: string
  client?: { name?: string } | null
  product?: { name?: string } | null
}): string {
  const client = work.client?.name ?? "—"
  const product = work.product?.name
  return product ? `${work.code} · ${client} · ${product}` : `${work.code} · ${client}`
}

export function SealingRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null

  const {
    works,
    loadingWorks,
    workOrderId,
    setWorkOrderId,
    selectedWork,
    shift,
    setShift,
    notes,
    setNotes,
    lines,
    patchLine,
    addLine,
    removeLine,
    loadingCoils,
    extrusionCoilCount,
    extrusionSummary,
    saving,
    fieldErrors,
    timerState,
    timerDisplaySeconds,
    startTimer,
    pauseTimer,
    stopTimer,
    submit,
  } = useSealingRegisterForm(
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) ? initialWorkOrderId : null,
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/sellado")
  }

  return (
    <PageShell
      title={SEALING_LABELS.registerTitle}
      subtitle={SEALING_LABELS.registerSubtitle}
      icon={Scissors}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/sellado">{SEALING_LABELS.title}</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4 pb-4">
        <ProductionFlowStrip
          activeStep="sellado"
          workOrderId={
            initialWorkOrderId != null && Number.isFinite(initialWorkOrderId)
              ? initialWorkOrderId
              : null
          }
        />

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <FormSectionCard
            title={SEALING_LABELS.fields.work}
            description={SEALING_LABELS.registerSubtitle}
            action={<SectionStep n={1} />}
          >
            <LabeledField htmlFor="seal-work" label={SEALING_LABELS.fields.work}>
              <select
                id="seal-work"
                className={productionSelectClassName}
                value={workOrderId}
                disabled={loadingWorks}
                onChange={(e) => setWorkOrderId(e.target.value)}
              >
                <option value="">Seleccione trabajo…</option>
                {works.map((work) => (
                  <option key={work.id} value={work.id}>
                    {workOptionLabel(work)}
                  </option>
                ))}
              </select>
              {fieldErrors.work ? <p className="text-xs text-rose-600">{fieldErrors.work}</p> : null}
            </LabeledField>

            {selectedWork ? (
              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  Orden: {selectedWork.production_order?.code ?? "—"} · Cliente:{" "}
                  {selectedWork.client?.name ?? "—"}
                </p>
                {loadingCoils ? (
                  <p className="text-xs text-slate-500">{SEALING_LABELS.coilsLoading}</p>
                ) : extrusionCoilCount > 0 ? (
                  <p className="text-xs font-medium text-violet-700">
                    {SEALING_LABELS.coilsFromExtrusion(extrusionCoilCount)} ·{" "}
                    {formatKgDisplay(extrusionSummary.totalKg)} kg en extrusión
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">{SEALING_LABELS.coilsEmpty}</p>
                )}
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledField htmlFor="seal-shift" label={SEALING_LABELS.fields.shift}>
                <select
                  id="seal-shift"
                  className={productionSelectClassName}
                  value={shift}
                  onChange={(e) => setShift(e.target.value as typeof shift)}
                >
                  {SEALING_SHIFTS.map((value) => (
                    <option key={value} value={value}>
                      {sealingShiftLabel(value)}
                    </option>
                  ))}
                </select>
              </LabeledField>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Temporizador</p>
                <p className="text-2xl font-semibold tabular-nums text-violet-700">
                  {formatTimerDisplay(timerDisplaySeconds)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={startTimer}>
                    {SEALING_LABELS.timerStart}
                  </Button>
                  {timerState === "running" ? (
                    <Button type="button" size="sm" variant="outline" onClick={pauseTimer}>
                      {SEALING_LABELS.timerPause}
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="outline" onClick={stopTimer}>
                    {SEALING_LABELS.timerStop}
                  </Button>
                </div>
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard title={SEALING_LABELS.linesSection} action={<SectionStep n={2} />}>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" size="sm" variant="outline" onClick={addLine}>
                {SEALING_LABELS.addLine}
              </Button>
            </div>
            {fieldErrors.lines ? (
              <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
            ) : null}
            <div className="space-y-3">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="grid gap-3 sm:grid-cols-6 items-end rounded-lg border border-slate-100 p-3"
                >
                  <LabeledField htmlFor={`coil-${line.key}`} label={SEALING_LABELS.fields.coilCode}>
                    <Input
                      id={`coil-${line.key}`}
                      value={line.coil_code}
                      readOnly={line.extrusion_coil_id != null}
                      className={line.extrusion_coil_id != null ? "bg-slate-50" : undefined}
                      onChange={(e) => patchLine(line.key, { coil_code: e.target.value })}
                      placeholder="BOB-…"
                    />
                  </LabeledField>
                  <LabeledField htmlFor={`measure-${line.key}`} label={SEALING_LABELS.fields.measure}>
                    <Input
                      id={`measure-${line.key}`}
                      value={line.measure}
                      readOnly={line.extrusion_coil_id != null}
                      className={line.extrusion_coil_id != null ? "bg-slate-50" : undefined}
                      onChange={(e) => patchLine(line.key, { measure: e.target.value })}
                    />
                  </LabeledField>
                  <LabeledField htmlFor={`units-${line.key}`} label={SEALING_LABELS.fields.units}>
                    <Input
                      id={`units-${line.key}`}
                      value={line.units}
                      onChange={(e) => patchLine(line.key, { units: e.target.value })}
                      inputMode="decimal"
                    />
                  </LabeledField>
                  <LabeledField
                    htmlFor={`production-${line.key}`}
                    label={SEALING_LABELS.fields.productionKg}
                  >
                    <Input
                      id={`production-${line.key}`}
                      value={line.production_kg}
                      readOnly={line.extrusion_coil_id != null}
                      className={line.extrusion_coil_id != null ? "bg-slate-50" : undefined}
                      onChange={(e) => patchLine(line.key, { production_kg: e.target.value })}
                      inputMode="decimal"
                    />
                  </LabeledField>
                  <LabeledField htmlFor={`waste-${line.key}`} label={SEALING_LABELS.fields.wasteKg}>
                    <Input
                      id={`waste-${line.key}`}
                      value={line.waste_kg}
                      onChange={(e) => patchLine(line.key, { waste_kg: e.target.value })}
                      inputMode="decimal"
                    />
                  </LabeledField>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(line.key)}>
                    {SEALING_LABELS.removeLine}
                  </Button>
                </div>
              ))}
            </div>
          </FormSectionCard>

          <FormSectionCard title={SEALING_LABELS.fields.notes} action={<SectionStep n={3} />}>
            <LabeledField htmlFor="seal-notes" label={SEALING_LABELS.fields.notes}>
              <Input id="seal-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </LabeledField>
          </FormSectionCard>

          <FormStickyFooter>
            <Button type="button" variant="outline" asChild>
              <Link to="/sellado">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={saving || loadingCoils}>
              {saving ? SEALING_LABELS.saving : SEALING_LABELS.save}
            </Button>
          </FormStickyFooter>
        </form>
      </div>
    </PageShell>
  )
}
