import { useEffect, useMemo } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { FlaskConical, Info, Plus, Trash2 } from "lucide-react"

import { useMaterialOptions } from "@/features/materials/hooks/useMaterialOptions"
import { isMixtureComponentMaterial } from "@/features/tinta-mixtures/domain/componentMaterials"
import {
  formatOrderQuantity,
  orderTargetKg,
} from "@/features/tinta-mixtures/domain/mixturePrefill"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import {
  formatPlantWorkLabel,
  usePlantWorkOptions,
} from "@/features/tinta-mixtures/hooks/usePlantWorkOptions"
import { useTintaMixtureForm } from "@/features/tinta-mixtures/hooks/useTintaMixtureForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { FormStickyFooter, SectionStep } from "@/features/production/shared/formUi"
import { PRODUCTION_FLOW_LABELS } from "@/features/production/shared/labels"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function MixingFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null
  const validWorkOrderId =
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) && initialWorkOrderId > 0
      ? initialWorkOrderId
      : null

  const { materials, loading: loadingMaterials } = useMaterialOptions()
  const { works, loading: loadingWorks, error: worksError, reload } = usePlantWorkOptions()
  const componentMaterials = materials.filter((m) => isMixtureComponentMaterial(m.inventory_area))

  const {
    workOrderId,
    setWorkOrderId,
    outputSku,
    outputName,
    notes,
    setNotes,
    components,
    patchComponent,
    addComponent,
    removeComponent,
    saving,
    loadingPrefill,
    prefillSource,
    requestedKgFromNotes,
    fieldErrors,
    submit,
    syncWorkDefaults,
    componentsTotal,
  } = useTintaMixtureForm(validWorkOrderId)

  const selectedWork = useMemo(
    () => works.find((work) => String(work.id) === workOrderId) ?? null,
    [works, workOrderId],
  )

  const workOptions = useMemo(
    () =>
      works.map((work) => ({
        value: String(work.id),
        label: formatPlantWorkLabel(work),
      })),
    [works],
  )

  const materialOptions = useMemo(
    () =>
      componentMaterials.map((material) => ({
        value: String(material.id),
        label: `${material.sku} · ${material.name}`,
      })),
    [componentMaterials],
  )

  const orderQuantityLabel = formatOrderQuantity(
    selectedWork?.order_quantity,
    selectedWork?.order_unit,
  )
  const orderTarget = orderTargetKg(selectedWork?.order_quantity, selectedWork?.order_unit)
  const mixtureTargetKg = requestedKgFromNotes ?? orderTarget

  const totalComparison = useMemo(() => {
    if (mixtureTargetKg == null || componentsTotal == null) return null
    const diff = componentsTotal - mixtureTargetKg
    if (Math.abs(diff) < 0.001) {
      return { kind: "match" as const }
    }
    if (diff < 0) {
      return {
        kind: "below" as const,
        message: MIXING_LABELS.totalBelowOrder(Math.abs(diff).toLocaleString("es-VE")),
      }
    }
    return {
      kind: "above" as const,
      message: MIXING_LABELS.totalAboveOrder(diff.toLocaleString("es-VE")),
    }
  }, [componentsTotal, mixtureTargetKg])

  useEffect(() => {
    syncWorkDefaults(selectedWork)
  }, [selectedWork, syncWorkDefaults])

  const componentsTotalLabel =
    componentsTotal != null ? componentsTotal.toLocaleString("es-VE") : "—"

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) {
      navigate(workOrderId ? `/mezcla?work_order_id=${workOrderId}` : "/mezcla")
    }
  }

  const backHref = workOrderId ? `/mezcla?work_order_id=${workOrderId}` : "/mezcla"

  return (
    <PageShell
      title={MIXING_LABELS.formTitle}
      subtitle={MIXING_LABELS.formSubtitle}
      icon={FlaskConical}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to={backHref}>{MIXING_LABELS.cancel}</Link>
        </Button>
      }
    >
      <ProductionFlowStrip
        activeStep="mezcla"
        workOrderId={Number(workOrderId) > 0 ? Number(workOrderId) : validWorkOrderId}
        className="mb-4"
      />

      <div className="mx-auto mb-4 flex max-w-5xl items-start gap-2 rounded-lg border border-violet-200/80 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>{MIXING_LABELS.formHelp}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-5xl space-y-4 pb-4">
        <FormSectionCard
          title={PRODUCTION_FLOW_LABELS.formSectionWork}
          description={PRODUCTION_FLOW_LABELS.formSectionWorkHint}
          action={<SectionStep n={1} />}
        >
          <LabeledField htmlFor="mix-work" label={MIXING_LABELS.fields.work}>
            <SearchableSelect
              id="mix-work"
              value={workOrderId}
              disabled={loadingWorks}
              placeholder={loadingWorks ? MIXING_LABELS.workLoading : MIXING_LABELS.workSelect}
              emptyMessage={MIXING_LABELS.noWorks}
              options={workOptions}
              onChange={setWorkOrderId}
              aria-invalid={Boolean(fieldErrors.work_order_id)}
            />
            {fieldErrors.work_order_id ? (
              <p className="text-xs text-rose-600">{fieldErrors.work_order_id}</p>
            ) : null}
            {worksError ? (
              <p className="text-xs text-amber-700">
                {worksError}{" "}
                <button type="button" className="underline" onClick={() => void reload()}>
                  Reintentar
                </button>
              </p>
            ) : !loadingWorks && works.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                {MIXING_LABELS.noWorksCallout}{" "}
                <Link to="/programacion" className="font-medium underline">
                  {MIXING_LABELS.noWorksCalloutLink}
                </Link>
              </div>
            ) : null}
          </LabeledField>
        </FormSectionCard>

        {selectedWork ? (
          <FormSectionCard
            title={MIXING_LABELS.formSectionProduct}
            description={MIXING_LABELS.formSectionProductHint}
            action={
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  title={MIXING_LABELS.outputAreaResinaHint}
                >
                  {MIXING_LABELS.outputAreaResina}
                </span>
                <SectionStep n={2} />
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <LabeledField htmlFor="mix-work-code" label={MIXING_LABELS.fields.outputSku}>
                <Input id="mix-work-code" value={outputSku} readOnly className="bg-slate-50" />
              </LabeledField>
              <LabeledField htmlFor="mix-product-name" label={MIXING_LABELS.fields.outputName}>
                <Input
                  id="mix-product-name"
                  value={outputName}
                  readOnly
                  className="bg-slate-50"
                />
              </LabeledField>
              <LabeledField htmlFor="mix-order-qty" label={MIXING_LABELS.fields.orderQuantity}>
                <Input
                  id="mix-order-qty"
                  value={orderQuantityLabel ?? "—"}
                  readOnly
                  className="bg-slate-50"
                />
              </LabeledField>
            </div>
          </FormSectionCard>
        ) : null}

        {selectedWork ? (
          <FormSectionCard
            title={MIXING_LABELS.formSectionMixture}
            description={MIXING_LABELS.formSectionMixtureHint}
            action={
              <div className="flex items-center gap-2">
                <SectionStep n={3} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loadingPrefill}
                  onClick={addComponent}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  {MIXING_LABELS.addComponent}
                </Button>
              </div>
            }
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                {PRODUCTION_FLOW_LABELS.componentsTotal(componentsTotalLabel)}
                {orderQuantityLabel ? (
                  <span className="font-normal text-slate-500">
                    {" "}
                    · Pedido: {orderQuantityLabel}
                  </span>
                ) : null}
              </p>

              {loadingPrefill ? (
                <p className="text-xs text-slate-500">{MIXING_LABELS.workLoading}</p>
              ) : prefillSource === "request" ? (
                <div className="space-y-1">
                  <p className="text-xs text-emerald-800">{MIXING_LABELS.prefillFromRequest}</p>
                  {requestedKgFromNotes != null ? (
                    <p className="text-xs font-medium text-emerald-900">
                      {MIXING_LABELS.requestedKgFromNotes(requestedKgFromNotes.toLocaleString("es-VE"))}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-xs text-slate-500">{MIXING_LABELS.prefillEmpty}</p>
              )}

              {totalComparison?.kind === "match" ? (
                <p className="text-xs font-medium text-emerald-700">
                  {MIXING_LABELS.totalMatchesOrder}
                </p>
              ) : totalComparison?.message ? (
                <p
                  className={cn(
                    "text-xs font-medium",
                    totalComparison.kind === "below" ? "text-amber-800" : "text-rose-700",
                  )}
                >
                  {totalComparison.message}
                </p>
              ) : orderTarget == null && requestedKgFromNotes == null ? (
                <p className="text-xs text-slate-500">{MIXING_LABELS.noOrderQuantityHint}</p>
              ) : null}
            </div>

            {!loadingMaterials && componentMaterials.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                {MIXING_LABELS.noComponentMaterials}
              </div>
            ) : null}

            <div className="space-y-3">
              {components.map((row, index) => (
                <div
                  key={row.key}
                  className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {MIXING_LABELS.fields.componentMaterial} {index + 1}
                    </span>
                    {components.length > 2 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600"
                        onClick={() => removeComponent(row.key)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {MIXING_LABELS.removeComponent}
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledField
                      htmlFor={`mix-comp-mat-${row.key}`}
                      label={MIXING_LABELS.fields.componentMaterial}
                    >
                      <SearchableSelect
                        id={`mix-comp-mat-${row.key}`}
                        value={row.material_id}
                        disabled={loadingMaterials || loadingPrefill}
                        placeholder="Seleccione…"
                        options={materialOptions}
                        onChange={(value) => patchComponent(row.key, { material_id: value })}
                      />
                      {fieldErrors[`components.${index}.material_id`] ? (
                        <p className="text-xs text-rose-600">
                          {fieldErrors[`components.${index}.material_id`]}
                        </p>
                      ) : null}
                    </LabeledField>

                    <LabeledField
                      htmlFor={`mix-comp-qty-${row.key}`}
                      label={MIXING_LABELS.fields.componentQty}
                    >
                      <Input
                        id={`mix-comp-qty-${row.key}`}
                        inputMode="decimal"
                        value={row.quantity}
                        disabled={loadingPrefill}
                        onChange={(e) => patchComponent(row.key, { quantity: e.target.value })}
                      />
                      {fieldErrors[`components.${index}.quantity`] ? (
                        <p className="text-xs text-rose-600">
                          {fieldErrors[`components.${index}.quantity`]}
                        </p>
                      ) : null}
                    </LabeledField>
                  </div>
                </div>
              ))}
            </div>
          </FormSectionCard>
        ) : null}

        <FormSectionCard
          title={PRODUCTION_FLOW_LABELS.formSectionNotes}
          description={PRODUCTION_FLOW_LABELS.formSectionNotesHint}
          action={<SectionStep n={selectedWork ? 4 : 2} />}
        >
          <LabeledField htmlFor="mix-notes" label={MIXING_LABELS.fields.notes}>
            <textarea
              id="mix-notes"
              className="flex min-h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </LabeledField>
        </FormSectionCard>

        <FormStickyFooter>
          <Button type="button" variant="outline" asChild>
            <Link to={backHref}>{MIXING_LABELS.cancel}</Link>
          </Button>
          <Button type="submit" disabled={saving || !workOrderId || loadingPrefill}>
            {saving ? MIXING_LABELS.saving : MIXING_LABELS.save}
          </Button>
        </FormStickyFooter>
      </form>
    </PageShell>
  )
}
