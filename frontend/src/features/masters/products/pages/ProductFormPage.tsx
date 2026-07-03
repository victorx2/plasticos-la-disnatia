import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Barcode,
  Building2,
  Info,
  Layers,
  Package,
  Save,
  Tag,
} from "lucide-react"

import { ProductPreviewCard } from "@/features/masters/products/components/ProductPreviewCard"
import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import { useProductForm } from "@/features/masters/products/hooks/useProductForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"
import { isSafeReturnPath, resolveAfterMasterSave } from "@/shared/navigation/masterFormReturn"

const textareaClassName = cn(
  "flex min-h-28 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm",
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-300",
)

function SectionStep({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
      {n}
    </span>
  )
}

export function ProductFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const returnTo = searchParams.get("return")
  const clientIdFromQuery = searchParams.get("client_id")
  const productId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(productId) && productId! > 0 ? productId : null

  const { form, patch, clients, loading, loadingClients, saving, isEdit, fieldErrors, submit } =
    useProductForm(validId, { initialClientId: clientIdFromQuery })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const savedId = await submit()
    if (savedId == null) return
    if (isSafeReturnPath(returnTo)) {
      navigate(
        resolveAfterMasterSave(returnTo, {
          client_id: form.clientId || clientIdFromQuery,
          product_id: savedId,
        }),
      )
      return
    }
    navigate("/productos")
  }

  if (loading) {
    return (
      <PageShell
        title={isEdit ? PRODUCT_LABELS.formEditTitle : PRODUCT_LABELS.formNewTitle}
        subtitle={PRODUCT_LABELS.formSubtitle}
        icon={Package}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={isEdit ? PRODUCT_LABELS.formEditTitle : PRODUCT_LABELS.formNewTitle}
      subtitle={PRODUCT_LABELS.formSubtitle}
      icon={Package}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to={isSafeReturnPath(returnTo) ? returnTo : "/productos"}>{PRODUCT_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-white to-violet-50/40 px-4 py-3.5 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 ring-1 ring-sky-200/80">
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-sm leading-relaxed text-slate-700">{PRODUCT_LABELS.formHelp}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={PRODUCT_LABELS.sections.identity}
              description={PRODUCT_LABELS.sections.identityHint}
              action={<SectionStep n={1} />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField
                  htmlFor="product-client"
                  label={PRODUCT_LABELS.fields.client}
                  icon={Building2}
                  className="sm:col-span-2"
                >
                  <SearchableSelect
                    id="product-client"
                    value={form.clientId}
                    disabled={loadingClients}
                    placeholder={PRODUCT_LABELS.clientSelect}
                    emptyMessage="No hay clientes registrados"
                    noResultsMessage="Ningún cliente coincide con la búsqueda"
                    aria-invalid={Boolean(fieldErrors.client_id)}
                    options={clients.map((client) => ({
                      value: String(client.id),
                      label: client.name,
                    }))}
                    onChange={(next) => patch({ clientId: next })}
                  />
                  {fieldErrors.client_id ? (
                    <p className="text-xs text-rose-600">{fieldErrors.client_id}</p>
                  ) : null}
                </LabeledField>

                <LabeledField
                  htmlFor="product-name"
                  label={PRODUCT_LABELS.fields.name}
                  icon={Tag}
                  className="sm:col-span-2"
                >
                  <Input
                    id="product-name"
                    className={cn(
                      "h-10 rounded-lg",
                      fieldErrors.name ? "border-rose-300 focus-visible:ring-rose-500/20" : null,
                    )}
                    value={form.name}
                    maxLength={255}
                    placeholder={PRODUCT_LABELS.fields.namePlaceholder}
                    aria-invalid={Boolean(fieldErrors.name)}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                  {fieldErrors.name ? (
                    <p className="text-xs text-rose-600">{fieldErrors.name}</p>
                  ) : null}
                </LabeledField>
              </div>
            </FormSectionCard>

            <FormSectionCard
              title={PRODUCT_LABELS.sections.specs}
              description={PRODUCT_LABELS.sections.specsHint}
              action={<SectionStep n={2} />}
            >
              <LabeledField
                htmlFor="product-barcode"
                label={PRODUCT_LABELS.fields.barcode}
                icon={Barcode}
              >
                <Input
                  id="product-barcode"
                  className="h-10 rounded-lg font-mono text-sm"
                  value={form.barcode}
                  maxLength={255}
                  placeholder="EAN / código interno"
                  onChange={(e) => patch({ barcode: e.target.value })}
                />
                {fieldErrors.barcode ? (
                  <p className="text-xs text-rose-600">{fieldErrors.barcode}</p>
                ) : null}
              </LabeledField>

              <LabeledField
                htmlFor="product-structure"
                label={PRODUCT_LABELS.fields.structure}
                icon={Layers}
              >
                <textarea
                  id="product-structure"
                  className={textareaClassName}
                  value={form.structure}
                  maxLength={300}
                  placeholder={PRODUCT_LABELS.fields.structurePlaceholder}
                  onChange={(e) => patch({ structure: e.target.value })}
                />
                <p className="text-xs leading-relaxed text-slate-500">
                  {PRODUCT_LABELS.fields.structureHint}
                </p>
                {fieldErrors.structure ? (
                  <p className="text-xs text-rose-600">{fieldErrors.structure}</p>
                ) : null}
              </LabeledField>
            </FormSectionCard>
          </div>

          <ProductPreviewCard form={form} clients={clients} />
        </div>

        <div className="sticky bottom-4 z-10 mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-5 py-4 text-center shadow-lg shadow-slate-200/50 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <p className="text-sm text-slate-500">{PRODUCT_LABELS.formFooterHint}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="submit" disabled={saving || loadingClients} className="gap-2">
              <Save className="h-4 w-4" aria-hidden />
              {saving ? PRODUCT_LABELS.saving : PRODUCT_LABELS.save}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/productos">{PRODUCT_LABELS.cancel}</Link>
            </Button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}
