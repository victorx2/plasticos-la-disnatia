import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Phone, User, Users } from "lucide-react"

import { VendorPreviewCard } from "@/features/masters/vendors/components/VendorPreviewCard"
import { PhotoUploadField } from "@/features/masters/shared/components/PhotoUploadField"
import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import { useVendorForm } from "@/features/masters/vendors/hooks/useVendorForm"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import {
  FormSectionStep,
  MasterFormStickyFooter,
  inputErrorClass,
  masterInputClassName,
} from "@/shared/catalog/masterFormUi"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib/utils"

export function VendorFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const vendorId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(vendorId) && vendorId! > 0 ? vendorId : null

  const {
    form,
    patch,
    loading,
    saving,
    isEdit,
    fieldErrors,
    submit,
    setPhonePrimary,
    setPhoneSecondary,
    active,
    clientsCount,
    photoPreviewSrc,
    handlePhotoSelect,
    handlePhotoRemove,
  } = useVendorForm(validId)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/vendedores")
  }

  if (loading) {
    return (
      <PageShell
        title={isEdit ? VENDOR_LABELS.formEditTitle : VENDOR_LABELS.formNewTitle}
        subtitle={VENDOR_LABELS.formSubtitle}
        icon={Users}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={isEdit ? VENDOR_LABELS.formEditTitle : VENDOR_LABELS.formNewTitle}
      subtitle={VENDOR_LABELS.formSubtitle}
      icon={Users}
      meta={
        isEdit ? (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
              )}
            >
              {active ? VENDOR_LABELS.status.active : VENDOR_LABELS.status.inactive}
            </span>
            <span className="text-slate-500">{VENDOR_LABELS.clientsCount(clientsCount)}</span>
          </span>
        ) : null
      }
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/vendedores">{VENDOR_LABELS.cancel}</Link>
        </Button>
      }
    >
      <form noValidate onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-6xl">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-4">
            <FormSectionCard
              title={VENDOR_LABELS.sections.identity}
              description={VENDOR_LABELS.sections.identityHint}
              action={<FormSectionStep n={1} />}
            >
              <LabeledField htmlFor="vendor-name" label={VENDOR_LABELS.fields.name} icon={User}>
                <div className="flex items-center gap-3">
                  <PhotoUploadField
                    name={form.name.trim() || "Nuevo vendedor"}
                    previewSrc={photoPreviewSrc}
                    size="md"
                    onSelectFile={handlePhotoSelect}
                    onRemove={handlePhotoRemove}
                  />
                  <div className="min-w-0 flex-1">
                    <Input
                      id="vendor-name"
                      className={cn(masterInputClassName, inputErrorClass(Boolean(fieldErrors.name)))}
                      value={form.name}
                      maxLength={255}
                      placeholder="Nombre del vendedor"
                      aria-invalid={Boolean(fieldErrors.name)}
                      onChange={(e) => patch({ name: e.target.value })}
                    />
                    {fieldErrors.name ? (
                      <p className="text-xs text-rose-600">{fieldErrors.name}</p>
                    ) : null}
                  </div>
                </div>
              </LabeledField>
            </FormSectionCard>

            <FormSectionCard
              title={VENDOR_LABELS.sections.contact}
              description={VENDOR_LABELS.sections.contactHint}
              action={<FormSectionStep n={2} />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledField
                  htmlFor="vendor-phone-primary"
                  label={VENDOR_LABELS.fields.phonePrimary}
                  icon={Phone}
                >
                  <Input
                    id="vendor-phone-primary"
                    className={cn(masterInputClassName, inputErrorClass(Boolean(fieldErrors.phonePrimary)))}
                    value={form.phonePrimary}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0255-0000000"
                    aria-invalid={Boolean(fieldErrors.phonePrimary)}
                    onChange={(e) => setPhonePrimary(e.target.value)}
                  />
                  {fieldErrors.phonePrimary ? (
                    <p className="text-xs text-rose-600">{fieldErrors.phonePrimary}</p>
                  ) : null}
                </LabeledField>
                <LabeledField
                  htmlFor="vendor-phone-secondary"
                  label={VENDOR_LABELS.fields.phoneSecondary}
                  icon={Phone}
                >
                  <Input
                    id="vendor-phone-secondary"
                    className={cn(masterInputClassName, inputErrorClass(Boolean(fieldErrors.phoneSecondary)))}
                    value={form.phoneSecondary}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0414-0000000"
                    aria-invalid={Boolean(fieldErrors.phoneSecondary)}
                    onChange={(e) => setPhoneSecondary(e.target.value)}
                  />
                  {fieldErrors.phoneSecondary ? (
                    <p className="text-xs text-rose-600">{fieldErrors.phoneSecondary}</p>
                  ) : null}
                </LabeledField>
              </div>
            </FormSectionCard>
          </div>

          <VendorPreviewCard form={form} photoPreviewSrc={photoPreviewSrc} />
        </div>

        <MasterFormStickyFooter
          hint={VENDOR_LABELS.formFooterHint}
          saving={saving}
          saveLabel={VENDOR_LABELS.save}
          savingLabel={VENDOR_LABELS.saving}
          cancelLabel={VENDOR_LABELS.cancel}
          cancelHref="/vendedores"
        />
      </form>
    </PageShell>
  )
}
