import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRightLeft,
  ClipboardList,
  Copy,
  Factory,
  Info,
  Layers,
  MessageSquareText,
  Package,
  Plus,
  Scale,
  Tag,
  Trash2,
  Warehouse,
  Ruler,
} from "lucide-react"

import { useMaterialOptions } from "@/features/materials/hooks/useMaterialOptions"
import { KgBalancePanel } from "@/features/material-requests/components/KgBalancePanel"
import { PrincipalBalanceBreakdown } from "@/features/material-requests/components/PrincipalBalanceBreakdown"
import {
  MATERIAL_REQUEST_LABELS,
  ORIGINATING_AREAS,
} from "@/features/material-requests/labels"
import { useMaterialRequestForm } from "@/features/material-requests/hooks/useMaterialRequestForm"
import {
  materialRequestHasPendingDispatch,
  materialRequestPendingKg,
  areaRequestInsumosHref,
} from "@/features/material-requests/domain/openMaterialRequest"
import { formatOrderQuantity } from "@/features/tinta-mixtures/domain/mixturePrefill"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { FormStickyFooter, productionSelectClassName, SectionStep } from "@/features/production/shared/formUi"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function MaterialRequestFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const workOrderIdRaw = searchParams.get("work_order_id")
  const initialWorkOrderId = workOrderIdRaw ? Number(workOrderIdRaw) : null
  const validWorkOrderId =
    initialWorkOrderId != null && Number.isFinite(initialWorkOrderId) && initialWorkOrderId > 0
      ? initialWorkOrderId
      : null

  const { materials, loading: loadingMaterials } = useMaterialOptions()
  const {
    works,
    loadingWorks,
    workOrderId,
    setWorkOrderId,
    selectedWork,
    formatWorkLabel,
    notes,
    setNotes,
    originatingArea,
    setOriginatingArea,
    lines,
    patchLine,
    addLine,
    removeLine,
    saving,
    loadingMixtures,
    loadFromMixtures,
    loadFromInitialRecipe,
    previewTotalKg,
    principalBalance,
    loadingPrincipal,
    principalExhausted,
    replenishmentMode,
    setReplenishmentMode,
    openRequest,
    loadingOpenRequest,
    getMaterialMaxKg,
    fieldErrors,
    submit,
    unitOptions,
  } = useMaterialRequestForm(validWorkOrderId)

  const openRequestPendingKg = openRequest
    ? (openRequest.lines ?? []).reduce((sum, line) => sum + materialRequestPendingKg(line), 0)
    : 0

  const mezclaPrincipalHref = workOrderId
    ? `/mezcla?work_order_id=${workOrderId}`
    : "/mezcla"

  const clientOrderQuantityLabel = formatOrderQuantity(
    selectedWork?.order_quantity,
    selectedWork?.order_unit,
  )

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = await submit()
    if (result.ok) {
      navigate(`/mezcla?work_order_id=${result.workOrderId}`)
    }
  }

  return (
    <PageShell
      title={MATERIAL_REQUEST_LABELS.formTitle}
      subtitle={MATERIAL_REQUEST_LABELS.formSubtitle}
      subtitleIcon={ArrowRightLeft}
      icon={Package}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/solicitudes-area">{MATERIAL_REQUEST_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto mb-4 flex max-w-4xl items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3.5 text-sm text-sky-950 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="font-medium text-sky-950">{MATERIAL_REQUEST_LABELS.helpFlow}</p>
          {principalBalance ? (
            <p className="mt-1.5 text-xs text-sky-800">{MATERIAL_REQUEST_LABELS.principalBalanceHint}</p>
          ) : null}
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-4xl space-y-4 pb-4">
        {openRequest && materialRequestHasPendingDispatch(openRequest) ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="font-semibold">
                {openRequest.is_replenishment
                  ? MATERIAL_REQUEST_LABELS.openReplenishmentRequestTitle
                  : MATERIAL_REQUEST_LABELS.openRequestTitle}
              </p>
              <p>
                {openRequest.is_replenishment
                  ? MATERIAL_REQUEST_LABELS.openReplenishmentRequestHint(
                      openRequest.id,
                      formatKgDisplay(openRequestPendingKg),
                    )
                  : MATERIAL_REQUEST_LABELS.openRequestHint(openRequest.id)}
              </p>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to={areaRequestInsumosHref(openRequest.id)}>
                  {MATERIAL_REQUEST_LABELS.openRequestAction}
                </Link>
              </Button>
            </div>
          </div>
        ) : loadingOpenRequest && workOrderId ? (
          <p className="text-sm text-slate-500">{MATERIAL_REQUEST_LABELS.loadingMixtures}</p>
        ) : null}

        {principalExhausted && !openRequest && workOrderId ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 space-y-3">
              <div>
                <p className="font-semibold">{MATERIAL_REQUEST_LABELS.replenishmentTitle}</p>
                <p className="mt-1 text-amber-900">{MATERIAL_REQUEST_LABELS.replenishmentHint}</p>
              </div>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                  checked={replenishmentMode}
                  onChange={(e) => setReplenishmentMode(e.target.checked)}
                />
                <span className="font-medium">{MATERIAL_REQUEST_LABELS.replenishmentToggle}</span>
              </label>
              {replenishmentMode ? (
                <p className="text-xs text-amber-800">{MATERIAL_REQUEST_LABELS.replenishmentNotesHint}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {principalBalance ? (
          <FormSectionCard
            title={MATERIAL_REQUEST_LABELS.sections.balance}
            description={MATERIAL_REQUEST_LABELS.sections.balanceHint}
            className="border-violet-200/80 bg-violet-50/40"
            action={
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to={mezclaPrincipalHref}>{MATERIAL_REQUEST_LABELS.viewPrincipalMixture}</Link>
              </Button>
            }
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
              <Layers className="h-4 w-4 shrink-0" aria-hidden />
              {MATERIAL_REQUEST_LABELS.principalBalanceTitle}
            </div>
            <KgBalancePanel
              kgAuthorized={principalBalance.kg_initial}
              kgDispatched={principalBalance.kg_dispatched}
              kgRemaining={principalBalance.kg_remaining}
            />
            <PrincipalBalanceBreakdown balance={principalBalance} />
          </FormSectionCard>
        ) : loadingPrincipal && workOrderId ? (
          <p className="text-sm text-slate-500">{MATERIAL_REQUEST_LABELS.loadingMixtures}</p>
        ) : null}

        <FormSectionCard
          title={MATERIAL_REQUEST_LABELS.sections.context}
          description={MATERIAL_REQUEST_LABELS.sections.contextHint}
          action={<SectionStep n={1} />}
        >
          <LabeledField
            htmlFor="mr-work"
            label={MATERIAL_REQUEST_LABELS.fields.workOrder}
            icon={Factory}
          >
            <select
              id="mr-work"
              className={productionSelectClassName}
              value={workOrderId}
              disabled={loadingWorks}
              required
              onChange={(e) => setWorkOrderId(e.target.value)}
            >
              <option value="">
                {loadingWorks ? MATERIAL_REQUEST_LABELS.workLoading : MATERIAL_REQUEST_LABELS.workSelect}
              </option>
              {works.map((work) => (
                <option key={work.id} value={String(work.id)}>
                  {formatWorkLabel(work)}
                </option>
              ))}
            </select>
            {!loadingWorks && works.length === 0 ? (
              <p className="text-xs text-amber-700">{MATERIAL_REQUEST_LABELS.noWorks}</p>
            ) : null}
            {fieldErrors.work_order_id ? (
              <p className="text-xs text-rose-600">{fieldErrors.work_order_id}</p>
            ) : null}
            {clientOrderQuantityLabel ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-violet-900">
                <Scale className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
                {MATERIAL_REQUEST_LABELS.fields.clientOrderQuantity}:{" "}
                <span className="font-semibold">{clientOrderQuantityLabel}</span>
              </p>
            ) : null}
          </LabeledField>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField
              htmlFor="mr-origin"
              label={MATERIAL_REQUEST_LABELS.fields.originatingArea}
              icon={ClipboardList}
            >
              <select
                id="mr-origin"
                className={productionSelectClassName}
                value={originatingArea}
                onChange={(e) => setOriginatingArea(e.target.value)}
              >
                {ORIGINATING_AREAS.map((area) => (
                  <option key={area.value} value={area.value}>
                    {area.label}
                  </option>
                ))}
              </select>
            </LabeledField>

            <LabeledField
              htmlFor="mr-dest"
              label={MATERIAL_REQUEST_LABELS.fields.destination}
              icon={Warehouse}
            >
              <Input
                id="mr-dest"
                value={MATERIAL_REQUEST_LABELS.placeholders.destination}
                readOnly
                className="border-emerald-200 bg-emerald-50/60 font-medium text-emerald-900"
              />
              <p className="text-xs text-slate-500">Destino fijo: pedidos de insumos van siempre a almacén.</p>
            </LabeledField>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title={MATERIAL_REQUEST_LABELS.sections.notes}
          description={MATERIAL_REQUEST_LABELS.sections.notesHint}
          action={<SectionStep n={2} />}
        >
          <LabeledField htmlFor="mr-notes" label={MATERIAL_REQUEST_LABELS.fields.notes} icon={MessageSquareText}>
            <textarea
              id="mr-notes"
              className="flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
              value={notes}
              required
              placeholder={MATERIAL_REQUEST_LABELS.placeholders.notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            {fieldErrors.notes ? (
              <p className="text-xs text-rose-600">{fieldErrors.notes}</p>
            ) : null}
          </LabeledField>
        </FormSectionCard>

        <FormSectionCard
          title={MATERIAL_REQUEST_LABELS.sections.lines}
          description={MATERIAL_REQUEST_LABELS.sections.linesHint}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {!replenishmentMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!workOrderId || loadingMixtures}
                  onClick={() => void loadFromMixtures()}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {loadingMixtures
                    ? MATERIAL_REQUEST_LABELS.loadingMixtures
                    : MATERIAL_REQUEST_LABELS.loadFromMixtures}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!workOrderId || loadingMixtures}
                  onClick={() => void loadFromInitialRecipe()}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {loadingMixtures
                    ? MATERIAL_REQUEST_LABELS.loadingMixtures
                    : MATERIAL_REQUEST_LABELS.loadInitialRecipe}
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {MATERIAL_REQUEST_LABELS.addLine}
              </Button>
              <SectionStep n={3} />
            </div>
          }
        >
          <div className="space-y-3">
            {lines.map((line, index) => {
              const materialMaxKg = replenishmentMode ? null : getMaterialMaxKg(line.material_id)
              const requestedKg = parseKgNumber(line.quantity_requested)
              const exceedsMaterial =
                !replenishmentMode &&
                materialMaxKg != null &&
                line.unit.toLowerCase() === "kg" &&
                requestedKg > materialMaxKg + 0.0001
              return (
                <div
                  key={line.key}
                  className={cn(
                    "space-y-3 rounded-xl border p-4 shadow-sm",
                    exceedsMaterial
                      ? "border-rose-200 bg-rose-50/40 ring-1 ring-rose-100"
                      : "border-violet-200/70 bg-white ring-1 ring-violet-100/80",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                      <Package className="h-3 w-3" aria-hidden />
                      Ítem {index + 1}
                    </span>
                    {lines.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => removeLine(line.key)}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        {MATERIAL_REQUEST_LABELS.removeLine}
                      </Button>
                    ) : null}
                  </div>

                  <LabeledField
                    htmlFor={`mr-material-${line.key}`}
                    label={MATERIAL_REQUEST_LABELS.fields.material}
                    icon={Tag}
                  >
                    <select
                      id={`mr-material-${line.key}`}
                      className={productionSelectClassName}
                      value={line.material_id}
                      disabled={loadingMaterials}
                      onChange={(e) => {
                        const mat = materials.find((m) => String(m.id) === e.target.value)
                        patchLine(line.key, {
                          material_id: e.target.value,
                          description: mat ? `${mat.sku} · ${mat.name}` : line.description,
                          unit: mat?.unit ?? line.unit,
                        })
                      }}
                    >
                      <option value="">{MATERIAL_REQUEST_LABELS.placeholders.materialEmpty}</option>
                      {materials.map((material) => (
                        <option key={material.id} value={String(material.id)}>
                          {material.sku} · {material.name}
                        </option>
                      ))}
                    </select>
                  </LabeledField>

                  <LabeledField
                    htmlFor={`mr-desc-${line.key}`}
                    label={MATERIAL_REQUEST_LABELS.fields.description}
                    icon={ClipboardList}
                  >
                    <Input
                      id={`mr-desc-${line.key}`}
                      value={line.description}
                      required
                      placeholder={MATERIAL_REQUEST_LABELS.placeholders.description}
                      onChange={(e) => patchLine(line.key, { description: e.target.value })}
                    />
                  </LabeledField>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledField
                      htmlFor={`mr-qty-${line.key}`}
                      label={MATERIAL_REQUEST_LABELS.fields.quantity}
                      icon={Scale}
                    >
                      <Input
                        id={`mr-qty-${line.key}`}
                        inputMode="decimal"
                        value={line.quantity_requested}
                        required
                        placeholder={MATERIAL_REQUEST_LABELS.placeholders.quantity}
                        className={exceedsMaterial ? "border-rose-300 ring-rose-200" : undefined}
                        onChange={(e) => patchLine(line.key, { quantity_requested: e.target.value })}
                      />
                      {materialMaxKg != null ? (
                        <p
                          className={`mt-1 text-xs ${exceedsMaterial ? "text-rose-600" : "text-slate-500"}`}
                        >
                          Máximo en mezcla principal: {formatKgDisplay(materialMaxKg)}
                        </p>
                      ) : null}
                    </LabeledField>

                    <LabeledField
                      htmlFor={`mr-unit-${line.key}`}
                      label={MATERIAL_REQUEST_LABELS.fields.unit}
                      icon={Ruler}
                    >
                      <select
                        id={`mr-unit-${line.key}`}
                        className={productionSelectClassName}
                        value={line.unit}
                        onChange={(e) => patchLine(line.key, { unit: e.target.value })}
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
              )
            })}
          </div>

          <KgBalancePanel previewTotalKg={previewTotalKg > 0 ? previewTotalKg : null} />
        </FormSectionCard>

        <FormStickyFooter className="rounded-xl border border-slate-200 bg-white/95 px-4">
          <Button
            type="submit"
            disabled={saving || Boolean(openRequest) || (principalExhausted && !replenishmentMode)}
          >
            {saving
              ? MATERIAL_REQUEST_LABELS.saving
              : replenishmentMode
                ? MATERIAL_REQUEST_LABELS.replenishmentSubmit
                : MATERIAL_REQUEST_LABELS.save}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/solicitudes-area">{MATERIAL_REQUEST_LABELS.cancel}</Link>
          </Button>
        </FormStickyFooter>
      </form>
    </PageShell>
  )
}
