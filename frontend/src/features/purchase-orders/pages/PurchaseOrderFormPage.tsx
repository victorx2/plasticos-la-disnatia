import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Calendar,
  FileText,
  Hash,
  Receipt,
  ShoppingCart,
  StickyNote,
  Truck,
} from "lucide-react"

import { useMaterialOptions } from "@/features/materials/hooks/useMaterialOptions"
import { useSupplierOptions } from "@/features/masters/shared/hooks/useSupplierOptions"
import { PurchaseOrderLinesEditor } from "@/features/purchase-orders/components/PurchaseOrderLinesEditor"
import { PurchaseOrderPreviewCard } from "@/features/purchase-orders/components/PurchaseOrderPreviewCard"
import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import { usePurchaseOrderForm } from "@/features/purchase-orders/hooks/usePurchaseOrderForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import {
  FormSectionStep,
  MasterFormStickyFooter,
  inputErrorClass,
  masterInputClassName,
  masterTextareaClassName,
} from "@/shared/catalog/masterFormUi"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

export function PurchaseOrderFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const orderId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(orderId) && orderId! > 0 ? orderId : null

  const { suppliers, loading: loadingSuppliers } = useSupplierOptions()
  const {
    form,
    patch,
    patchLine,
    addLine,
    removeLine,
    loading,
    saving,
    isEdit,
    hasReceipts,
    fieldErrors,
    submit,
  } = usePurchaseOrderForm(validId)

  const supplierIdNum = form.supplier_id ? Number(form.supplier_id) : null
  const { materials, loading: loadingMaterials } = useMaterialOptions(supplierIdNum)

  const title = isEdit
    ? hasReceipts
      ? PURCHASE_ORDER_LABELS.formViewTitle
      : PURCHASE_ORDER_LABELS.formEditTitle
    : PURCHASE_ORDER_LABELS.formNewTitle

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/ordenes-compra")
  }

  if (loading) {
    return (
      <PageShell title={title} subtitle={PURCHASE_ORDER_LABELS.formSubtitle} icon={ShoppingCart}>
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={title}
      subtitle={PURCHASE_ORDER_LABELS.formSubtitle}
      icon={ShoppingCart}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/ordenes-compra">{PURCHASE_ORDER_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={PURCHASE_ORDER_LABELS.sections.header}
              description={PURCHASE_ORDER_LABELS.sections.headerHint}
              action={<FormSectionStep n={1} />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField htmlFor="po-code" label={PURCHASE_ORDER_LABELS.fields.code} icon={Hash}>
                  <Input
                    id="po-code"
                    className={cn(
                      masterInputClassName,
                      "font-mono text-sm",
                      isEdit ? "bg-slate-50" : null,
                      inputErrorClass(Boolean(fieldErrors.code)),
                    )}
                    value={form.code}
                    maxLength={64}
                    readOnly={isEdit}
                    aria-invalid={Boolean(fieldErrors.code)}
                    onChange={(e) => patch({ code: e.target.value })}
                  />
                  {fieldErrors.code ? (
                    <p className="text-xs text-rose-600">{fieldErrors.code}</p>
                  ) : null}
                </LabeledField>

                <LabeledField
                  htmlFor="po-ordered-at"
                  label={PURCHASE_ORDER_LABELS.fields.orderedAt}
                  icon={Calendar}
                >
                  <Input
                    id="po-ordered-at"
                    type="date"
                    className={masterInputClassName}
                    value={form.ordered_at}
                    onChange={(e) => patch({ ordered_at: e.target.value })}
                  />
                  {fieldErrors.ordered_at ? (
                    <p className="text-xs text-rose-600">{fieldErrors.ordered_at}</p>
                  ) : null}
                </LabeledField>
              </div>

              <LabeledField
                htmlFor="po-supplier"
                label={PURCHASE_ORDER_LABELS.fields.supplier}
                icon={Truck}
              >
                <SearchableSelect
                  id="po-supplier"
                  value={form.supplier_id}
                  disabled={loadingSuppliers}
                  placeholder={PURCHASE_ORDER_LABELS.supplierSelect}
                  emptyMessage="No hay proveedores registrados"
                  noResultsMessage="Ningún proveedor coincide con la búsqueda"
                  aria-invalid={Boolean(fieldErrors.supplier_id)}
                  options={suppliers.map((supplier) => ({
                    value: String(supplier.id),
                    label: supplier.name,
                  }))}
                  onChange={(next) => patch({ supplier_id: next })}
                />
                {fieldErrors.supplier_id ? (
                  <p className="text-xs text-rose-600">{fieldErrors.supplier_id}</p>
                ) : null}
              </LabeledField>

              <LabeledField htmlFor="po-notes" label={PURCHASE_ORDER_LABELS.fields.notes} icon={StickyNote}>
                <textarea
                  id="po-notes"
                  className={masterTextareaClassName}
                  value={form.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                />
                {fieldErrors.notes ? (
                  <p className="text-xs text-rose-600">{fieldErrors.notes}</p>
                ) : null}
              </LabeledField>

              <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  checked={form.tax_applies}
                  onChange={(e) => patch({ tax_applies: e.target.checked })}
                />
                <Receipt className="h-4 w-4 text-violet-500/70" aria-hidden />
                {PURCHASE_ORDER_LABELS.fields.taxApplies}
              </label>
            </FormSectionCard>

            <FormSectionCard
              title={PURCHASE_ORDER_LABELS.sections.lines}
              description={PURCHASE_ORDER_LABELS.sections.linesHint}
              action={<FormSectionStep n={2} />}
            >
              <PurchaseOrderLinesEditor
                lines={form.lines}
                materials={materials}
                loadingMaterials={loadingMaterials}
                fieldErrors={fieldErrors}
                onPatchLine={patchLine}
                onAddLine={addLine}
                onRemoveLine={removeLine}
              />
            </FormSectionCard>

            {isEdit ? (
              <FormSectionCard title={PURCHASE_ORDER_LABELS.fields.changeReason}>
                <LabeledField
                  htmlFor="po-change-reason"
                  label={PURCHASE_ORDER_LABELS.fields.changeReason}
                  icon={FileText}
                >
                  <Input
                    id="po-change-reason"
                    className={cn(masterInputClassName, inputErrorClass(Boolean(fieldErrors.change_reason)))}
                    value={form.change_reason}
                    maxLength={500}
                    aria-invalid={Boolean(fieldErrors.change_reason)}
                    onChange={(e) => patch({ change_reason: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">{PURCHASE_ORDER_LABELS.changeReasonHint}</p>
                  {fieldErrors.change_reason ? (
                    <p className="text-xs text-rose-600">{fieldErrors.change_reason}</p>
                  ) : null}
                </LabeledField>
              </FormSectionCard>
            ) : null}

            {isEdit && hasReceipts ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                Esta orden ya tiene recepciones. No puede eliminar líneas con material recibido ni
                bajar la cantidad pedida por debajo de lo recibido.
              </p>
            ) : null}
          </div>

          <PurchaseOrderPreviewCard form={form} suppliers={suppliers} />
        </div>

        <MasterFormStickyFooter
          hint={PURCHASE_ORDER_LABELS.formFooterHint}
          saving={saving}
          saveLabel={PURCHASE_ORDER_LABELS.save}
          savingLabel={PURCHASE_ORDER_LABELS.saving}
          cancelLabel={PURCHASE_ORDER_LABELS.cancel}
          cancelHref="/ordenes-compra"
          disabled={loadingSuppliers}
        />
      </form>
    </PageShell>
  )
}
