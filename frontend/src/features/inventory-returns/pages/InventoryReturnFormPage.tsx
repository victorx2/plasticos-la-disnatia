import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Clock,
  Factory,
  Info,
  MessageSquareText,
  PackageOpen,
  Plus,
  RotateCcw,
  Scale,
  Tag,
  Trash2,
  Undo2,
} from "lucide-react"

import { INVENTORY_RETURN_LABELS } from "@/features/inventory-returns/labels"
import { useInventoryReturnForm } from "@/features/inventory-returns/hooks/useInventoryReturnForm"
import type { ReturnRoute } from "@/features/inventory-returns/hooks/useInventoryReturnForm"
import { extrusionShiftLabel } from "@/features/production/extrusion/labels"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { FormStickyFooter, productionSelectClassName, SectionStep } from "@/features/production/shared/formUi"
import {
  formatPlantWorkLabel,
  usePlantWorkOptions,
} from "@/features/tinta-mixtures/hooks/usePlantWorkOptions"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function InventoryReturnFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialWorkOrderId = searchParams.get("work_order_id") ?? undefined

  const { works, loading: loadingWorks } = usePlantWorkOptions()
  const {
    workOrderId,
    setWorkOrderId,
    returnRoute,
    setReturnRoute,
    reason,
    setReason,
    lines,
    products,
    loadingProducts,
    lineMeta,
    totalKg,
    addLine,
    removeLine,
    updateLine,
    saving,
    fieldErrors,
    submit,
    formatLineKg,
  } = useInventoryReturnForm({
    workOrderId: initialWorkOrderId,
    reason:
      searchParams.get("kind") === "rejected"
        ? "Devolución desde producción — enviar a almacén"
        : undefined,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/devoluciones")
  }

  function quantityOptions(maxUnits: number) {
    const max = Math.max(1, Math.min(maxUnits, 10))
    return Array.from({ length: max }, (_, index) => index + 1)
  }

  return (
    <PageShell
      title={INVENTORY_RETURN_LABELS.formTitle}
      subtitle={INVENTORY_RETURN_LABELS.formSubtitle}
      subtitleIcon={Undo2}
      icon={PackageOpen}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/devoluciones">{INVENTORY_RETURN_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto mb-4 flex max-w-4xl items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3.5 text-sm text-sky-950 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-medium">{INVENTORY_RETURN_LABELS.helpFlow}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-4xl space-y-4 pb-4">
        <FormSectionCard
          title={INVENTORY_RETURN_LABELS.sections.workOrder}
          description={INVENTORY_RETURN_LABELS.sections.workOrderHint}
          action={<SectionStep n={1} />}
        >
          <LabeledField
            htmlFor="ret-work-order"
            label={INVENTORY_RETURN_LABELS.fields.workOrder}
            icon={Factory}
          >
            <select
              id="ret-work-order"
              className={productionSelectClassName}
              value={workOrderId}
              required
              disabled={loadingWorks}
              onChange={(e) => setWorkOrderId(e.target.value)}
            >
              <option value="">{INVENTORY_RETURN_LABELS.placeholders.workOrderSelect}</option>
              {works.map((work) => (
                <option key={work.id} value={String(work.id)}>
                  {formatPlantWorkLabel(work)}
                </option>
              ))}
            </select>
            {fieldErrors.work_order_id ? (
              <p className="text-xs text-rose-600">{fieldErrors.work_order_id}</p>
            ) : null}
          </LabeledField>
        </FormSectionCard>

        <FormSectionCard
          title={INVENTORY_RETURN_LABELS.sections.route}
          description={INVENTORY_RETURN_LABELS.sections.routeHint}
          action={<SectionStep n={2} />}
        >
          <LabeledField htmlFor="ret-route" label={INVENTORY_RETURN_LABELS.fields.route} icon={RotateCcw}>
            <select
              id="ret-route"
              className={productionSelectClassName}
              value={returnRoute}
              onChange={(e) => setReturnRoute(e.target.value as ReturnRoute)}
            >
              <option value="fallas">{INVENTORY_RETURN_LABELS.routes.fallas}</option>
              <option value="rejected">{INVENTORY_RETURN_LABELS.routes.rejected}</option>
              <option value="tintas">{INVENTORY_RETURN_LABELS.routes.tintas}</option>
            </select>
          </LabeledField>
          <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-medium text-amber-900">
            {INVENTORY_RETURN_LABELS.routeHints[returnRoute]}
          </p>
        </FormSectionCard>

        <FormSectionCard
          title={INVENTORY_RETURN_LABELS.sections.products}
          description={INVENTORY_RETURN_LABELS.sections.productsHint}
          action={
            <div className="flex items-center gap-2">
              <SectionStep n={3} />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!workOrderId}
                onClick={addLine}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {INVENTORY_RETURN_LABELS.addProduct}
              </Button>
            </div>
          }
        >
          {!workOrderId ? (
            <p className="text-sm text-slate-500">{INVENTORY_RETURN_LABELS.placeholders.workOrderSelect}</p>
          ) : loadingProducts ? (
            <p className="text-sm text-slate-500">{INVENTORY_RETURN_LABELS.loadingProducts}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-amber-700">{INVENTORY_RETURN_LABELS.noProductsForWork}</p>
          ) : (
            <div className="space-y-3">
              {lines.map((line, index) => {
                const meta = lineMeta(line)
                const shiftLabel = meta.shift ? extrusionShiftLabel(meta.shift) : "—"

                return (
                  <div
                    key={line.key}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Producto {index + 1}
                      </p>
                      {lines.length > 1 ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 text-rose-600 hover:text-rose-700"
                          onClick={() => removeLine(line.key)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          {INVENTORY_RETURN_LABELS.removeProduct}
                        </Button>
                      ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <LabeledField
                        htmlFor={`ret-product-${line.key}`}
                        label={INVENTORY_RETURN_LABELS.fields.product}
                        icon={Tag}
                      >
                        <select
                          id={`ret-product-${line.key}`}
                          className={productionSelectClassName}
                          value={line.product_key}
                          required
                          onChange={(e) =>
                            updateLine(line.key, {
                              product_key: e.target.value,
                              quantity_units: "1",
                            })
                          }
                        >
                          <option value="">{INVENTORY_RETURN_LABELS.placeholders.productSelect}</option>
                          {products.map((product) => (
                            <option key={product.key} value={product.key}>
                              {product.label}
                            </option>
                          ))}
                        </select>
                      </LabeledField>

                      <LabeledField
                        htmlFor={`ret-qty-${line.key}`}
                        label={INVENTORY_RETURN_LABELS.fields.quantityUnits}
                        icon={Scale}
                      >
                        <select
                          id={`ret-qty-${line.key}`}
                          className={productionSelectClassName}
                          value={line.quantity_units}
                          disabled={!line.product_key}
                          onChange={(e) => updateLine(line.key, { quantity_units: e.target.value })}
                        >
                          {quantityOptions(meta.maxUnits).map((value) => (
                            <option key={value} value={String(value)}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </LabeledField>

                      <LabeledField label={INVENTORY_RETURN_LABELS.fields.shift} icon={Clock}>
                        <Input
                          readOnly
                          value={line.product_key ? shiftLabel : "—"}
                          className="bg-white"
                        />
                      </LabeledField>

                      <LabeledField label={INVENTORY_RETURN_LABELS.fields.kg} icon={Scale}>
                        <Input
                          readOnly
                          value={line.product_key ? formatLineKg(line) : "—"}
                          className="bg-white font-medium tabular-nums"
                        />
                      </LabeledField>
                    </div>
                    {line.product_key &&
                    meta.product?.product_type === "bobina" &&
                    meta.kg <= 0 ? (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        {INVENTORY_RETURN_LABELS.noWeightHint}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {workOrderId && products.length > 0 ? (
            <p className="text-sm font-medium text-slate-700">
              {INVENTORY_RETURN_LABELS.fields.totalKg}:{" "}
              <span className="tabular-nums text-violet-700">{formatKgDisplay(totalKg)}</span>
            </p>
          ) : null}
        </FormSectionCard>

        <FormSectionCard
          title={INVENTORY_RETURN_LABELS.sections.details}
          description={INVENTORY_RETURN_LABELS.sections.detailsHint}
          action={<SectionStep n={4} />}
        >
          <LabeledField htmlFor="ret-reason" label={INVENTORY_RETURN_LABELS.fields.reason} icon={MessageSquareText}>
            <textarea
              id="ret-reason"
              className="flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
              value={reason}
              placeholder={INVENTORY_RETURN_LABELS.placeholders.reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {fieldErrors.reason ? (
              <p className="text-xs text-rose-600">{fieldErrors.reason}</p>
            ) : null}
          </LabeledField>
        </FormSectionCard>

        <FormStickyFooter className="rounded-xl border border-slate-200 bg-white/95 px-4">
          <Button type="submit" disabled={saving || !workOrderId || products.length === 0}>
            {saving ? INVENTORY_RETURN_LABELS.saving : INVENTORY_RETURN_LABELS.save}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/devoluciones">{INVENTORY_RETURN_LABELS.cancel}</Link>
          </Button>
        </FormStickyFooter>
      </form>
    </PageShell>
  )
}
