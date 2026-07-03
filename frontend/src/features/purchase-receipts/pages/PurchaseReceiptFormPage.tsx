import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Calendar,
  ClipboardList,
  FileText,
  Info,
  MessageSquareText,
  PackageCheck,
  Truck,
} from "lucide-react"

import { PurchaseReceiptLinesEditor } from "@/features/purchase-receipts/components/PurchaseReceiptLinesEditor"
import { PURCHASE_RECEIPT_LABELS } from "@/features/purchase-receipts/labels"
import { usePurchaseReceiptForm } from "@/features/purchase-receipts/hooks/usePurchaseReceiptForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { FormStickyFooter, productionSelectClassName, SectionStep } from "@/features/production/shared/formUi"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

export function PurchaseReceiptFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ocParam = searchParams.get("oc")
  const initialPoId = ocParam ? Number(ocParam) : null
  const validPoId = Number.isFinite(initialPoId) && initialPoId! > 0 ? initialPoId : null

  const {
    form,
    patch,
    patchLine,
    pendingOrders,
    materials,
    loadingOrders,
    loadingPo,
    saving,
    fieldErrors,
    submit,
    loadPurchaseOrder,
  } = usePurchaseReceiptForm(validPoId)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/recepciones")
  }

  function handlePoChange(poId: string) {
    patch({ purchase_order_id: poId })
    const id = Number(poId)
    if (Number.isFinite(id) && id > 0) void loadPurchaseOrder(id)
  }

  if (loadingOrders || loadingPo) {
    return (
      <PageShell
        title={PURCHASE_RECEIPT_LABELS.formTitle}
        subtitle={PURCHASE_RECEIPT_LABELS.formSubtitle}
        subtitleIcon={PackageCheck}
        icon={PackageCheck}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={PURCHASE_RECEIPT_LABELS.formTitle}
      subtitle={PURCHASE_RECEIPT_LABELS.formSubtitle}
      subtitleIcon={PackageCheck}
      icon={PackageCheck}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/recepciones">{PURCHASE_RECEIPT_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto mb-4 flex max-w-4xl items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3.5 text-sm text-sky-950 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-medium">{PURCHASE_RECEIPT_LABELS.helpFlow}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-4xl space-y-4 pb-4">
        <FormSectionCard
          title={PURCHASE_RECEIPT_LABELS.sections.order}
          description={PURCHASE_RECEIPT_LABELS.sections.orderHint}
          action={<SectionStep n={1} />}
        >
          <LabeledField
            htmlFor="rec-po"
            label={PURCHASE_RECEIPT_LABELS.fields.purchaseOrder}
            icon={ClipboardList}
          >
            <select
              id="rec-po"
              className={productionSelectClassName}
              value={form.purchase_order_id}
              required
              onChange={(e) => handlePoChange(e.target.value)}
            >
              <option value="">{PURCHASE_RECEIPT_LABELS.poSelect}</option>
              {pendingOrders.map((order) => (
                <option key={order.id} value={String(order.id)}>
                  {order.code} — {order.supplier?.name ?? `Proveedor #${order.supplier_id}`}
                </option>
              ))}
            </select>
            {fieldErrors.purchase_order_id ? (
              <p className="text-xs text-rose-600">{fieldErrors.purchase_order_id}</p>
            ) : null}
          </LabeledField>

          <LabeledField htmlFor="rec-supplier" label={PURCHASE_RECEIPT_LABELS.fields.supplier} icon={Truck}>
            <Input
              id="rec-supplier"
              value={form.supplier_name}
              readOnly
              className="border-emerald-200 bg-emerald-50/60 font-medium text-emerald-900"
              placeholder="Se completa al elegir la OC"
            />
          </LabeledField>
        </FormSectionCard>

        <FormSectionCard
          title={PURCHASE_RECEIPT_LABELS.sections.document}
          description={PURCHASE_RECEIPT_LABELS.sections.documentHint}
          action={<SectionStep n={2} />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledField htmlFor="rec-invoice" label={PURCHASE_RECEIPT_LABELS.fields.invoice} icon={FileText}>
              <Input
                id="rec-invoice"
                value={form.invoice_number}
                maxLength={191}
                required
                placeholder={PURCHASE_RECEIPT_LABELS.placeholders.invoice}
                onChange={(e) => patch({ invoice_number: e.target.value })}
              />
              {fieldErrors.invoice_number ? (
                <p className="text-xs text-rose-600">{fieldErrors.invoice_number}</p>
              ) : null}
            </LabeledField>

            <LabeledField
              htmlFor="rec-date"
              label={PURCHASE_RECEIPT_LABELS.fields.receivedAt}
              icon={Calendar}
            >
              <Input
                id="rec-date"
                type="date"
                value={form.received_at}
                required
                onChange={(e) => patch({ received_at: e.target.value })}
              />
              {fieldErrors.received_at ? (
                <p className="text-xs text-rose-600">{fieldErrors.received_at}</p>
              ) : null}
            </LabeledField>
          </div>
        </FormSectionCard>

        <FormSectionCard
          title={PURCHASE_RECEIPT_LABELS.sections.notes}
          description={PURCHASE_RECEIPT_LABELS.sections.notesHint}
          action={<SectionStep n={3} />}
        >
          <LabeledField htmlFor="rec-notes" label={PURCHASE_RECEIPT_LABELS.fields.notes} icon={MessageSquareText}>
            <textarea
              id="rec-notes"
              className="flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
              value={form.notes}
              placeholder={PURCHASE_RECEIPT_LABELS.placeholders.notes}
              onChange={(e) => patch({ notes: e.target.value })}
            />
          </LabeledField>
        </FormSectionCard>

        <FormSectionCard
          title={PURCHASE_RECEIPT_LABELS.sections.lines}
          description={PURCHASE_RECEIPT_LABELS.sections.linesHint}
          action={<SectionStep n={4} />}
        >
          <PurchaseReceiptLinesEditor
            lines={form.lines}
            materials={materials}
            fieldErrors={fieldErrors}
            onPatchLine={patchLine}
          />
        </FormSectionCard>

        <FormStickyFooter className="rounded-xl border border-slate-200 bg-white/95 px-4">
          <Button type="submit" disabled={saving}>
            {saving ? PURCHASE_RECEIPT_LABELS.saving : PURCHASE_RECEIPT_LABELS.save}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/recepciones">{PURCHASE_RECEIPT_LABELS.cancel}</Link>
          </Button>
        </FormStickyFooter>
      </form>
    </PageShell>
  )
}
