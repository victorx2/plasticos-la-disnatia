import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Mail, MapPin, Phone, Tag, Truck } from "lucide-react"

import { getSessionAppRole, isInventoryRole } from "@/config/permissions"
import { RifFieldGroup } from "@/features/masters/shared/components/RifFieldGroup"
import { PhotoUploadField } from "@/features/masters/shared/components/PhotoUploadField"
import { SupplierPreviewCard } from "@/features/masters/suppliers/components/SupplierPreviewCard"
import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import { useSupplierForm } from "@/features/masters/suppliers/hooks/useSupplierForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import {
  FormSectionStep,
  MasterFormStickyFooter,
  inputErrorClass,
  masterInputClassName,
  masterTextareaClassName,
} from "@/shared/catalog/masterFormUi"
import { getStoredUser } from "@/shared/auth/session"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

export function SupplierFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const supplierId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(supplierId) && supplierId! > 0 ? supplierId : null

  const inventoryView = isInventoryRole(getSessionAppRole(getStoredUser()))

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
    photoPreviewSrc,
    handlePhotoSelect,
    handlePhotoRemove,
  } = useSupplierForm(validId)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/proveedores")
  }

  if (loading) {
    return (
      <PageShell
        title={isEdit ? SUPPLIER_LABELS.formEditTitle : SUPPLIER_LABELS.formNewTitle}
        subtitle={SUPPLIER_LABELS.formSubtitle}
        icon={Truck}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={isEdit ? SUPPLIER_LABELS.formEditTitle : SUPPLIER_LABELS.formNewTitle}
      subtitle={SUPPLIER_LABELS.formSubtitle}
      icon={Truck}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/proveedores">{SUPPLIER_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={SUPPLIER_LABELS.sections.identity}
              description={SUPPLIER_LABELS.sections.identityHint}
              action={<FormSectionStep n={1} />}
            >
              <LabeledField htmlFor="supplier-name" label={SUPPLIER_LABELS.fields.name} icon={Tag}>
                <div className="flex items-center gap-3">
                  <PhotoUploadField
                    name={form.name.trim() || "Nuevo proveedor"}
                    previewSrc={photoPreviewSrc}
                    size="md"
                    onSelectFile={handlePhotoSelect}
                    onRemove={handlePhotoRemove}
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      id="supplier-name"
                      className={cn(masterInputClassName, inputErrorClass(Boolean(fieldErrors.name)))}
                      value={form.name}
                      maxLength={255}
                      placeholder="Razón social o nombre comercial"
                      aria-invalid={Boolean(fieldErrors.name)}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                    {fieldErrors.name ? (
                      <p className="text-xs text-rose-600">{fieldErrors.name}</p>
                    ) : null}
                  </div>
                </div>
              </LabeledField>

              <RifFieldGroup
                label={SUPPLIER_LABELS.fields.rif}
                parts={{
                  rifLetter: form.rifLetter,
                  rifMain: form.rifMain,
                  rifDv: form.rifDv,
                }}
                allowNoRif
                noRif={form.noRif}
                noRifLabel={SUPPLIER_LABELS.noRif}
                onNoRifChange={setNoRif}
                onLetterChange={setRifLetter}
                onMainChange={setRifMain}
                onDvChange={setRifDv}
                error={fieldErrors.rif}
              />
            </FormSectionCard>

            {!inventoryView ? (
              <FormSectionCard
                title={SUPPLIER_LABELS.sections.contact}
                description={SUPPLIER_LABELS.sections.contactHint}
                action={<FormSectionStep n={2} />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <LabeledField htmlFor="supplier-email" label={SUPPLIER_LABELS.fields.email} icon={Mail}>
                    <Input
                      id="supplier-email"
                      type="email"
                      className={masterInputClassName}
                      value={form.email}
                      maxLength={255}
                      placeholder="correo@proveedor.com"
                      onChange={(e) => patch({ email: e.target.value })}
                    />
                    {fieldErrors.email ? (
                      <p className="text-xs text-rose-600">{fieldErrors.email}</p>
                    ) : null}
                  </LabeledField>
                  <LabeledField htmlFor="supplier-phone" label={SUPPLIER_LABELS.fields.phone} icon={Phone}>
                    <Input
                      id="supplier-phone"
                      className={masterInputClassName}
                      value={form.phone}
                      placeholder="0255-0000000"
                      onChange={(e) => setPhone(e.target.value)}
                    />
                    {fieldErrors.phone ? (
                      <p className="text-xs text-rose-600">{fieldErrors.phone}</p>
                    ) : null}
                  </LabeledField>
                </div>

                <LabeledField htmlFor="supplier-address" label={SUPPLIER_LABELS.fields.address} icon={MapPin}>
                  <textarea
                    id="supplier-address"
                    className={masterTextareaClassName}
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
            ) : null}
          </div>

          <SupplierPreviewCard form={form} photoPreviewSrc={photoPreviewSrc} />
        </div>

        <MasterFormStickyFooter
          hint={SUPPLIER_LABELS.formFooterHint}
          saving={saving}
          saveLabel={SUPPLIER_LABELS.save}
          savingLabel={SUPPLIER_LABELS.saving}
          cancelLabel={SUPPLIER_LABELS.cancel}
          cancelHref="/proveedores"
        />
      </form>
    </PageShell>
  )
}
