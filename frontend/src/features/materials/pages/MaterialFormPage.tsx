import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { Boxes, Info } from "lucide-react"

import { MaterialFormFields } from "@/features/materials/components/MaterialFormFields"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { useMaterialForm } from "@/features/materials/hooks/useMaterialForm"
import { FormStickyFooter } from "@/features/production/shared/formUi"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

export function MaterialFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idParam = searchParams.get("id")
  const materialId = idParam ? Number(idParam) : null
  const validId = Number.isFinite(materialId) && materialId! > 0 ? materialId : null

  const { form, patch, loading, saving, isEdit, fieldErrors, submit } = useMaterialForm(validId)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const ok = await submit()
    if (ok) navigate("/materiales")
  }

  if (loading) {
    return (
      <PageShell
        title={isEdit ? MATERIAL_LABELS.formEditTitle : MATERIAL_LABELS.formNewTitle}
        subtitle={MATERIAL_LABELS.formSubtitle}
        icon={Boxes}
      >
        <p className="text-sm text-slate-500">Cargando…</p>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={isEdit ? MATERIAL_LABELS.formEditTitle : MATERIAL_LABELS.formNewTitle}
      subtitle={MATERIAL_LABELS.formSubtitle}
      subtitleIcon={Boxes}
      icon={Boxes}
      action={
        <Button type="button" variant="outline" asChild>
          <Link to="/materiales">{MATERIAL_LABELS.cancel}</Link>
        </Button>
      }
    >
      <div className="mx-auto mb-4 flex max-w-4xl items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3.5 text-sm text-sky-950 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-medium">{MATERIAL_LABELS.helpFlow}</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-4xl space-y-4 pb-4">
        <MaterialFormFields
          form={form}
          patch={patch}
          fieldErrors={fieldErrors}
          isEdit={isEdit}
        />

        <FormStickyFooter className="rounded-xl border border-slate-200 bg-white/95 px-4">
          <Button type="submit" disabled={saving}>
            {saving ? MATERIAL_LABELS.saving : MATERIAL_LABELS.save}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/materiales">{MATERIAL_LABELS.cancel}</Link>
          </Button>
        </FormStickyFooter>
      </form>
    </PageShell>
  )
}
