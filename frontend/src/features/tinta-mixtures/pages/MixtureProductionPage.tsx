import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertTriangle, FlaskConical } from "lucide-react"

import { MixtureProductionHistory } from "@/features/tinta-mixtures/components/MixtureProductionHistory"
import { useMixtureProductionWizard } from "@/features/tinta-mixtures/hooks/useMixtureProductionWizard"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import {
  FormStickyFooter,
  productionSelectClassName,
  SectionStep,
} from "@/features/production/shared/formUi"
import { PRODUCTION_FLOW_LABELS } from "@/features/production/shared/labels"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { PageShell } from "@/shared/catalog/PageShell"
import { formatKgDisplay } from "@/shared/format/numbers"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"

export function MixtureProductionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null
  const validWorkOrderId =
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) && initialWorkOrderId > 0
      ? initialWorkOrderId
      : null

  const {
    works,
    loadingWorks,
    workOrderId,
    setWorkOrderId,
    validWorkId,
    formatWorkLabel,
    mixtures,
    loadingMixtures,
    activeRuns,
    loadingRuns,
    selectedMixtureId,
    setSelectedMixtureId,
    selectedMixtureKgLabel,
    selectedMixtureDispatchedLabel,
    selectedMixturePendingLabel,
    selectedMixtureProjectedLabel,
    loadingBalance,
    submezclaBalance,
    principalBalance,
    starting,
    startProduction,
    continueExtrusion,
  } = useMixtureProductionWizard(validWorkOrderId)

  const backHref = validWorkId ? `/mezcla?work_order_id=${validWorkId}` : "/mezcla"
  const requestMpHref = validWorkId
    ? `/solicitudes-material/nueva?work_order_id=${validWorkId}`
    : "/solicitudes-material/nueva"

  return (
    <PageShell
      title={MIXING_LABELS.productionTitle}
      subtitle={MIXING_LABELS.productionSubtitle}
      icon={FlaskConical}
      meta={
        <span
          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
          title={MIXING_LABELS.outputAreaResinaHint}
        >
          {MIXING_LABELS.outputAreaResina}
        </span>
      }
      action={
        <Button type="button" variant="outline" asChild>
          <Link to={backHref}>{MIXING_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto max-w-5xl space-y-4 pb-4">
        <ProductionFlowStrip activeStep="mezcla" workOrderId={validWorkId} />

        <FormSectionCard
          title={PRODUCTION_FLOW_LABELS.formSectionWork}
          description={PRODUCTION_FLOW_LABELS.formSectionWorkHint}
          action={<SectionStep n={1} />}
        >
          <LabeledField htmlFor="prod-work" label={MIXING_LABELS.fields.work}>
            <select
              id="prod-work"
              className={productionSelectClassName}
              value={workOrderId}
              disabled={loadingWorks}
              onChange={(e) => setWorkOrderId(e.target.value)}
            >
              <option value="">
                {loadingWorks ? MIXING_LABELS.workLoading : MIXING_LABELS.workSelect}
              </option>
              {works.map((work) => (
                <option key={work.id} value={String(work.id)}>
                  {formatWorkLabel(work)}
                </option>
              ))}
            </select>
          </LabeledField>
        </FormSectionCard>

        {validWorkId ? (
          <>
            {activeRuns.length > 0 ? (
              <FormSectionCard title={MIXING_LABELS.activeRuns}>
                {loadingRuns ? (
                  <p className="text-sm text-slate-500">Cargando…</p>
                ) : (
                  <ul className="space-y-2">
                    {activeRuns.map((run) => (
                      <li
                        key={run.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-violet-200/80 bg-violet-50/40 px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-slate-800">
                          {run.mixture_output_sku} · {run.mixture_output_name}
                        </span>
                        {submezclaBalance && Number(submezclaBalance.kg_available) > 0 ? (
                          <p className="text-xs text-violet-700">
                            {MIXING_LABELS.continueExtrusionHint(
                              formatKgDisplay(submezclaBalance.kg_available),
                            )}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={starting}
                          onClick={() => {
                            void continueExtrusion(run).then((href) => {
                              if (href) void navigate(href)
                            })
                          }}
                        >
                          {MIXING_LABELS.continueExtrusion}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </FormSectionCard>
            ) : null}

            <FormSectionCard
              title={MIXING_LABELS.selectMixture}
              description={MIXING_LABELS.productionStartHint}
              action={<SectionStep n={2} />}
            >
              <LabeledField htmlFor="prod-mixture" label={MIXING_LABELS.selectMixture}>
                <select
                  id="prod-mixture"
                  className={productionSelectClassName}
                  value={selectedMixtureId}
                  disabled={loadingMixtures}
                  onChange={(e) => setSelectedMixtureId(e.target.value)}
                >
                  <option value="">{MIXING_LABELS.selectMixture}</option>
                  {mixtures.map((mixture) => (
                    <option key={mixture.id} value={String(mixture.id)}>
                      {mixture.output_sku} · {mixture.output_name}
                    </option>
                  ))}
                </select>
              </LabeledField>
              {selectedMixtureId ? (
                <div className="space-y-1 text-sm text-violet-800">
                  <p>
                    {MIXING_LABELS.mixtureKgToUse}: <strong>{selectedMixtureKgLabel}</strong>
                    {loadingBalance ? " …" : null}
                  </p>
                  {selectedMixtureDispatchedLabel ? (
                    <p className="text-xs text-slate-600">
                      {MIXING_LABELS.mixtureKgDispatched}: {selectedMixtureDispatchedLabel}
                    </p>
                  ) : null}
                  {selectedMixturePendingLabel ? (
                    <p className="text-xs text-amber-800">
                      {MIXING_LABELS.mixtureKgPendingWarehouse}: {selectedMixturePendingLabel}
                      {" · "}
                      {MIXING_LABELS.mixtureKgAfterDispatch}:{" "}
                      <strong>{selectedMixtureProjectedLabel}</strong>
                    </p>
                  ) : null}
                </div>
              ) : null}
              {!loadingMixtures && mixtures.length === 0 ? (
                <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
                  <div className="flex items-start gap-2 text-sm text-amber-950">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <div className="space-y-2">
                      <p className="font-medium">{MIXING_LABELS.noMixtures}</p>
                      <p className="text-xs text-amber-900">{MIXING_LABELS.noMixturesHelp}</p>
                      <ol className="list-decimal space-y-1 pl-4 text-xs text-amber-900">
                        <li>{MIXING_LABELS.noMixturesStepRequest}</li>
                        <li>{MIXING_LABELS.noMixturesStepWarehouse}</li>
                        <li>{MIXING_LABELS.noMixturesStepReturn}</li>
                      </ol>
                      {principalBalance ? (
                        <p className="text-xs font-medium text-amber-900">{MIXING_LABELS.noMixturesHasPrincipal}</p>
                      ) : null}
                      {submezclaBalance && Number(submezclaBalance.kg_pending_warehouse) > 0 ? (
                        <p className="text-xs font-medium text-amber-900">
                          {MIXING_LABELS.noMixturesPendingWarehouse(
                            selectedMixturePendingLabel ??
                              formatKgDisplay(submezclaBalance.kg_pending_warehouse),
                          )}
                        </p>
                      ) : null}
                      <Button type="button" size="sm" variant="outline" asChild>
                        <Link to={requestMpHref}>{MIXING_LABELS.requestMoreMp}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
              <Button
                type="button"
                disabled={starting || !selectedMixtureId}
                onClick={() => {
                  void startProduction().then((href) => {
                    if (href) void navigate(href)
                  })
                }}
              >
                {starting ? MIXING_LABELS.starting : MIXING_LABELS.startProduction}
              </Button>
            </FormSectionCard>

            <FormSectionCard title={MIXING_LABELS.historyTitle}>
              <MixtureProductionHistory workOrderId={validWorkId} />
            </FormSectionCard>

            <FormStickyFooter className="justify-between">
              <p className="mr-auto hidden text-xs text-slate-500 sm:block">
                {MIXING_LABELS.requestMoreMpHint}
              </p>
              <Button type="button" variant="outline" asChild>
                <Link to={requestMpHref}>{MIXING_LABELS.requestMoreMp}</Link>
              </Button>
            </FormStickyFooter>
          </>
        ) : null}
      </div>
    </PageShell>
  )
}
