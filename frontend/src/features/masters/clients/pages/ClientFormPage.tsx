import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useMemo } from "react"
import { Mail, MapPin, Phone, User, UserPlus, Users } from "lucide-react"

import { getSessionAppRole, isInventoryRole } from "@/config/permissions"
import { ClientPreviewCard } from "@/features/masters/clients/components/ClientPreviewCard"
import { PhotoUploadField } from "@/features/masters/shared/components/PhotoUploadField"
import { RifFieldGroup } from "@/features/masters/shared/components/RifFieldGroup"
import { useVendorOptions } from "@/features/masters/shared/hooks/useVendorOptions"
import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import { useClientForm } from "@/features/masters/clients/hooks/useClientForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { SearchableSelect } from "@/shared/catalog/SearchableSelect"
import { getStoredUser } from "@/shared/auth/session"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { isSafeReturnPath, resolveAfterMasterSave } from "@/shared/navigation/masterFormReturn"

function SectionStep({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
      {n}
    </span>
  )
}

export function ClientFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const returnTo = searchParams.get("return")
  const clientId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(clientId) && clientId! > 0 ? clientId : null

  const role = getSessionAppRole(getStoredUser())
  const inventoryView = isInventoryRole(role)

  const {
    form,
    patch,
    loading,
    saving,
    isEdit,
    fieldErrors,
    submit,
    setRifLetter,
    setRifMain,
    setRifDv,
    setPhone,
    setNoRif,
    setVendorId,
    photoPreviewSrc,
    handlePhotoSelect,
    handlePhotoRemove,
  } = useClientForm(validId)

  const { vendors, loading: loadingVendors } = useVendorOptions()

  const vendorOptions = useMemo(() => {
    const options = vendors.map((vendor) => ({
      value: String(vendor.id),
      label: vendor.name,
    }))
    if (
      form.vendorId &&
      !options.some((option) => option.value === form.vendorId)
    ) {
      options.unshift({
        value: form.vendorId,
        label: form.vendorName.trim() || `Vendedor #${form.vendorId}`,
      })
    }
    return options
  }, [vendors, form.vendorId, form.vendorName])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const savedId = await submit()
    if (savedId == null) return
    if (isSafeReturnPath(returnTo)) {
      navigate(resolveAfterMasterSave(returnTo, { client_id: savedId }))
      return
    }
    navigate("/clientes")
  }

  if (loading) {
    return (
      <PageShell
        title={isEdit ? CLIENT_LABELS.formEditTitle : CLIENT_LABELS.formNewTitle}
        subtitle={CLIENT_LABELS.formSubtitle}
        icon={UserPlus}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={isEdit ? CLIENT_LABELS.formEditTitle : CLIENT_LABELS.formNewTitle}
      subtitle={CLIENT_LABELS.formSubtitle}
      icon={UserPlus}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to={isSafeReturnPath(returnTo) ? returnTo : "/clientes"}>{CLIENT_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={CLIENT_LABELS.sections.identity}
              description={CLIENT_LABELS.sections.identityHint}
              action={<SectionStep n={1} />}
            >
              <LabeledField htmlFor="client-name" label={CLIENT_LABELS.fields.name} icon={User}>
                <div className="flex items-center gap-3">
                  <PhotoUploadField
                    name={form.name.trim() || "Nuevo cliente"}
                    previewSrc={photoPreviewSrc}
                    size="sm"
                    onSelectFile={handlePhotoSelect}
                    onRemove={handlePhotoRemove}
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      id="client-name"
                      value={form.name}
                      maxLength={255}
                      placeholder="Nombre comercial o razón social"
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                    {fieldErrors.name ? (
                      <p className="text-xs text-rose-600">{fieldErrors.name}</p>
                    ) : null}
                  </div>
                </div>
              </LabeledField>

              <RifFieldGroup
                label={CLIENT_LABELS.fields.rif}
                parts={{
                  rifLetter: form.rifLetter,
                  rifMain: form.rifMain,
                  rifDv: form.rifDv,
                }}
                allowNoRif
                noRif={form.noRif}
                noRifLabel={CLIENT_LABELS.noRif}
                onNoRifChange={setNoRif}
                onLetterChange={setRifLetter}
                onMainChange={setRifMain}
                onDvChange={setRifDv}
                error={fieldErrors.rif}
              />
            </FormSectionCard>

            {!inventoryView ? (
              <FormSectionCard
                title={CLIENT_LABELS.sections.commercial}
                description={CLIENT_LABELS.sections.commercialHint}
                action={<SectionStep n={2} />}
              >
                <LabeledField htmlFor="client-vendor" label={CLIENT_LABELS.fields.vendor} icon={Users}>
                  <SearchableSelect
                    id="client-vendor"
                    value={form.vendorId}
                    disabled={loadingVendors}
                    placeholder={CLIENT_LABELS.vendorSelect}
                    emptyMessage="No hay vendedores activos"
                    noResultsMessage="Ningún vendedor coincide con la búsqueda"
                    aria-invalid={Boolean(fieldErrors.vendor_id)}
                    options={vendorOptions}
                    onChange={(next) => {
                      const selected = vendorOptions.find((option) => option.value === next)
                      setVendorId(next, selected?.label ?? "")
                    }}
                  />
                  <p className="text-xs text-slate-500">{CLIENT_LABELS.vendorOptionalHint}</p>
                  {fieldErrors.vendor_id ? (
                    <p className="text-xs text-rose-600">{fieldErrors.vendor_id}</p>
                  ) : null}
                </LabeledField>
              </FormSectionCard>
            ) : null}

            {!inventoryView ? (
              <>
                <FormSectionCard
                  title={CLIENT_LABELS.sections.location}
                  description={CLIENT_LABELS.sections.locationHint}
                  action={<SectionStep n={3} />}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabeledField htmlFor="client-state" label={CLIENT_LABELS.fields.state} icon={MapPin}>
                      <Input
                        id="client-state"
                        value={form.state}
                        maxLength={255}
                        placeholder="Ej. Portuguesa"
                        onChange={(e) => patch({ state: e.target.value })}
                      />
                      {fieldErrors.state ? (
                        <p className="text-xs text-rose-600">{fieldErrors.state}</p>
                      ) : null}
                    </LabeledField>
                    <LabeledField htmlFor="client-city" label={CLIENT_LABELS.fields.city} icon={MapPin}>
                      <Input
                        id="client-city"
                        value={form.city}
                        maxLength={255}
                        placeholder="Ej. Acarigua"
                        onChange={(e) => patch({ city: e.target.value })}
                      />
                      {fieldErrors.city ? (
                        <p className="text-xs text-rose-600">{fieldErrors.city}</p>
                      ) : null}
                    </LabeledField>
                  </div>
                </FormSectionCard>

                <FormSectionCard
                  title={CLIENT_LABELS.sections.contact}
                  description={CLIENT_LABELS.sections.contactHint}
                  action={<SectionStep n={4} />}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <LabeledField htmlFor="client-email" label={CLIENT_LABELS.fields.email} icon={Mail}>
                      <Input
                        id="client-email"
                        type="email"
                        value={form.email}
                        maxLength={255}
                        placeholder="correo@empresa.com"
                        onChange={(e) => patch({ email: e.target.value })}
                      />
                      {fieldErrors.email ? (
                        <p className="text-xs text-rose-600">{fieldErrors.email}</p>
                      ) : null}
                    </LabeledField>
                    <LabeledField htmlFor="client-phone" label={CLIENT_LABELS.fields.phone} icon={Phone}>
                      <Input
                        id="client-phone"
                        value={form.phone}
                        placeholder="0255-0000000"
                        onChange={(e) => setPhone(e.target.value)}
                      />
                      {fieldErrors.phone ? (
                        <p className="text-xs text-rose-600">{fieldErrors.phone}</p>
                      ) : null}
                    </LabeledField>
                  </div>

                  <LabeledField htmlFor="client-address" label={CLIENT_LABELS.fields.address} icon={MapPin}>
                    <textarea
                      id="client-address"
                      className="flex min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
                      value={form.address}
                      maxLength={2000}
                      placeholder="Dirección fiscal o de entrega"
                      onChange={(e) => patch({ address: e.target.value })}
                    />
                    {fieldErrors.address ? (
                      <p className="text-xs text-rose-600">{fieldErrors.address}</p>
                    ) : null}
                  </LabeledField>
                </FormSectionCard>
              </>
            ) : null}
          </div>

          {!inventoryView ? (
            <ClientPreviewCard form={form} photoPreviewSrc={photoPreviewSrc} />
          ) : null}
        </div>

        <div className="sticky bottom-4 z-10 mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-5 py-4 text-center shadow-lg shadow-slate-200/50 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <p className="text-sm text-slate-500">
            {isEdit ? "Actualiza los datos del cliente." : "Completa los campos obligatorios."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? CLIENT_LABELS.saving : CLIENT_LABELS.save}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/clientes">{CLIENT_LABELS.cancel}</Link>
            </Button>
          </div>
        </div>
      </form>
    </PageShell>
  )
}
