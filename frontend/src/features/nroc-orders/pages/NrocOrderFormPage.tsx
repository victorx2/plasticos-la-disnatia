import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  Building2,
  Calendar,
  FileText,
  Info,
  MapPin,
  Package,
  Plus,
  Save,
  ScrollText,
  StickyNote,
  UserPlus,
} from "lucide-react"
import { useEffect } from "react"

import { ProductionOrderLinesEditor } from "@/features/nroc-orders/components/ProductionOrderLinesEditor"
import { ProductionOrderPreviewCard } from "@/features/nroc-orders/components/ProductionOrderPreviewCard"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import { useNrocOrderForm } from "@/features/nroc-orders/hooks/useNrocOrderForm"
import { useClientOptions } from "@/features/masters/shared/hooks/useClientOptions"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { PageShell } from "@/shared/catalog/PageShell"
import { RifBadge } from "@/shared/catalog/RifBadge"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import { buildMasterFormHref } from "@/shared/navigation/masterFormReturn"

const selectClassName = cn(
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm",
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-300",
  "disabled:bg-slate-50 disabled:text-slate-500",
)

const textareaClassName = cn(
  "flex min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm",
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-300",
  "disabled:bg-slate-50",
)

function SectionStep({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
      {n}
    </span>
  )
}

export function NrocOrderFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const orderIdRaw = searchParams.get("id")
  const batchIdRaw = searchParams.get("batch_id")
  const clientIdFromQuery = searchParams.get("client_id")
  const productIdFromQuery = searchParams.get("product_id")
  const batchIdFromQuery = batchIdRaw ? Number(batchIdRaw) : null
  const orderId = orderIdRaw ? Number(orderIdRaw) : null
  const validOrderId =
    orderId != null && Number.isFinite(orderId) && orderId > 0 ? orderId : null
  const validBatchId =
    batchIdFromQuery != null && Number.isFinite(batchIdFromQuery) && batchIdFromQuery > 0
      ? batchIdFromQuery
      : null

  const { clients, loading: loadingClients, reload: reloadClients } = useClientOptions()
  const returnTo = `${location.pathname}${location.search}`

  useEffect(() => {
    if (clientIdFromQuery) void reloadClients()
  }, [clientIdFromQuery, reloadClients])

  const {
    loading,
    saving,
    clientId,
    setClientId,
    selectedClient,
    saleFor,
    setSaleFor,
    orderedAt,
    setOrderedAt,
    notes,
    setNotes,
    status,
    setStatus,
    lines,
    addLine,
    removeLine,
    updateLine,
    products,
    loadingProducts,
    fieldErrors,
    readOnly,
    submit,
    isEdit,
    batchId,
    batchCode,
  } = useNrocOrderForm(validOrderId, clients, validBatchId, {
    initialClientId: clientIdFromQuery,
    initialProductId: productIdFromQuery,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate(isEdit || batchId ? "/orden-produccion" : "/programacion")
  }

  const title = isEdit
    ? PRODUCTION_ORDER_LABELS.formTitleEdit
    : batchId && batchCode
      ? `${PRODUCTION_ORDER_LABELS.addToBatchTitle} — ${batchCode}`
      : batchId
        ? PRODUCTION_ORDER_LABELS.addToBatchTitle
        : PRODUCTION_ORDER_LABELS.formTitleNew

  if (loading) {
    return (
      <PageShell title={title} subtitle={PRODUCTION_ORDER_LABELS.formSubtitle} icon={ScrollText}>
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={title}
      subtitle={PRODUCTION_ORDER_LABELS.formSubtitle}
      icon={ScrollText}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/orden-produccion">{PRODUCTION_ORDER_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-white to-violet-50/40 px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/80">
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-slate-700">{PRODUCTION_ORDER_LABELS.formHelp}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={PRODUCTION_ORDER_LABELS.sections.identity}
              description={PRODUCTION_ORDER_LABELS.sections.identityHint}
              action={<SectionStep n={1} />}
            >
              {batchId && batchCode ? (
                <p className="mb-4 rounded-lg border border-violet-200 bg-violet-50/50 px-4 py-3 text-sm text-violet-900">
                  {PRODUCTION_ORDER_LABELS.addToBatchHint(batchCode)}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField
                  htmlFor="nroc-client"
                  label={PRODUCTION_ORDER_LABELS.fields.client}
                  icon={Building2}
                  className="sm:col-span-2"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <SearchableSelect
                          id="nroc-client"
                          value={clientId}
                          disabled={loadingClients || readOnly}
                          placeholder={PRODUCTION_ORDER_LABELS.clientSelect}
                          emptyMessage="No hay clientes registrados"
                          noResultsMessage="Ningún cliente coincide con la búsqueda"
                          aria-invalid={Boolean(fieldErrors.client_id)}
                          options={clients.map((client) => ({
                            value: String(client.id),
                            label: client.name,
                          }))}
                          onChange={setClientId}
                        />
                      </div>
                      {!readOnly ? (
                        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" asChild>
                          <Link to={buildMasterFormHref("/clientes/form", { returnTo })}>
                            <UserPlus className="h-3.5 w-3.5" aria-hidden />
                            {PRODUCTION_ORDER_LABELS.newClient}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    {!readOnly ? (
                      <p className="text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.createClientHint}</p>
                    ) : null}
                  </div>
                  {fieldErrors.client_id ? (
                    <p className="text-xs text-rose-600">{fieldErrors.client_id}</p>
                  ) : null}
                </LabeledField>

                <LabeledField
                  htmlFor="nroc-sale-for"
                  label={PRODUCTION_ORDER_LABELS.fields.saleFor}
                  icon={FileText}
                >
                  <Input
                    id="nroc-sale-for"
                    className="h-10 rounded-lg"
                    value={saleFor}
                    disabled={readOnly}
                    placeholder={PRODUCTION_ORDER_LABELS.saleForPlaceholder}
                    onChange={(e) => setSaleFor(e.target.value)}
                  />
                </LabeledField>

                <LabeledField
                  htmlFor="nroc-ordered-at"
                  label={PRODUCTION_ORDER_LABELS.fields.orderedAt}
                  icon={Calendar}
                >
                  <Input
                    id="nroc-ordered-at"
                    type="date"
                    className="h-10 rounded-lg"
                    value={orderedAt}
                    disabled={readOnly}
                    onChange={(e) => setOrderedAt(e.target.value)}
                  />
                </LabeledField>

                {isEdit ? (
                  <LabeledField htmlFor="nroc-status" label={PRODUCTION_ORDER_LABELS.fields.status}>
                    <select
                      id="nroc-status"
                      className={selectClassName}
                      value={status}
                      disabled={readOnly}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="open">Abierto</option>
                      <option value="fulfilled">Cumplido</option>
                      <option value="cancelled">Anulado</option>
                    </select>
                  </LabeledField>
                ) : null}
              </div>

              {clientId ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-600">
                    {PRODUCTION_ORDER_LABELS.fields.rif}:
                    <RifBadge rif={selectedClient?.rif} />
                  </span>
                  <span className="inline-flex items-start gap-1.5 text-slate-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    <span className="min-w-0">
                      {selectedClient?.address?.trim() || PRODUCTION_ORDER_LABELS.clientDataEmpty}
                    </span>
                  </span>
                </div>
              ) : null}
            </FormSectionCard>

            <FormSectionCard
              title={PRODUCTION_ORDER_LABELS.sections.notes}
              description={PRODUCTION_ORDER_LABELS.sections.notesHint}
              action={<SectionStep n={2} />}
            >
              <LabeledField
                htmlFor="nroc-notes"
                label={PRODUCTION_ORDER_LABELS.fields.notes}
                icon={StickyNote}
              >
                <textarea
                  id="nroc-notes"
                  rows={3}
                  className={textareaClassName}
                  value={notes}
                  disabled={readOnly}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                />
              </LabeledField>
            </FormSectionCard>

            <FormSectionCard
              title={PRODUCTION_ORDER_LABELS.sections.lines}
              description={PRODUCTION_ORDER_LABELS.sections.linesHint}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <SectionStep n={3} />
                  {!readOnly ? (
                    <>
                      <Button type="button" variant="outline" size="sm" onClick={addLine}>
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                        {PRODUCTION_ORDER_LABELS.addLine}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={!clientId}
                        asChild={Boolean(clientId)}
                      >
                        {clientId ? (
                          <Link
                            to={buildMasterFormHref("/productos/form", {
                              returnTo,
                              clientId,
                            })}
                          >
                            <Package className="h-3.5 w-3.5" aria-hidden />
                            {PRODUCTION_ORDER_LABELS.newProduct}
                          </Link>
                        ) : (
                          <>
                            <Package className="h-3.5 w-3.5" aria-hidden />
                            {PRODUCTION_ORDER_LABELS.newProduct}
                          </>
                        )}
                      </Button>
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-bold tabular-nums text-violet-700">
                        {lines.length}
                      </span>
                    </>
                  ) : null}
                </div>
              }
            >
              {!readOnly && clientId ? (
                <p className="mb-3 text-xs text-slate-500">{PRODUCTION_ORDER_LABELS.createProductHint}</p>
              ) : null}
              <ProductionOrderLinesEditor
                lines={lines}
                products={products}
                clientId={clientId}
                loadingProducts={loadingProducts}
                readOnly={readOnly}
                fieldErrors={fieldErrors}
                onAddLine={addLine}
                onRemoveLine={removeLine}
                onUpdateLine={updateLine}
                showHeader={false}
              />
            </FormSectionCard>
          </div>

          <ProductionOrderPreviewCard
            clientName={selectedClient?.name ?? ""}
            saleFor={saleFor}
            orderedAt={orderedAt}
            notes={notes}
            lines={lines}
            products={products}
            batchCode={batchCode}
          />
        </div>

        {!readOnly ? (
          <div className="sticky bottom-4 z-10 mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-5 py-4 text-center shadow-lg shadow-slate-200/50 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <p className="text-sm text-slate-500">{PRODUCTION_ORDER_LABELS.formFooterHint}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="submit" disabled={saving || loadingClients} className="gap-2">
                <Save className="h-4 w-4" aria-hidden />
                {saving ? PRODUCTION_ORDER_LABELS.saving : PRODUCTION_ORDER_LABELS.save}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/orden-produccion">{PRODUCTION_ORDER_LABELS.cancel}</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </PageShell>
  )
}
