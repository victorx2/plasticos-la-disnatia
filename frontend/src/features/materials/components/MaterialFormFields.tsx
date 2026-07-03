import {
  Box,
  FilePenLine,
  Hash,
  Layers,
  MessageSquareText,
  Package,
  Ruler,
  Scale,
  Tag,
  Truck,
} from "lucide-react"

import { MATERIAL_CATEGORIES } from "@/features/materials/domain/categories"
import { DEFAULT_UNIT, kgFromSacos, sacosFromKg } from "@/features/materials/domain/units"
import { buildSkuFromTypeBrand } from "@/features/materials/domain/material-display"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import type { MaterialFormState } from "@/features/materials/hooks/useMaterialForm"
import { useSupplierOptions } from "@/features/masters/shared/hooks/useSupplierOptions"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { productionSelectClassName, SectionStep } from "@/features/production/shared/formUi"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Input } from "@/shared/ui/input"

type MaterialFormFieldsProps = {
  form: MaterialFormState
  patch: (partial: Partial<MaterialFormState>) => void
  fieldErrors: Record<string, string>
  isEdit: boolean
}

export function MaterialFormFields({ form, patch, fieldErrors, isEdit }: MaterialFormFieldsProps) {
  const { suppliers, loading: loadingSuppliers } = useSupplierOptions()

  function handleKgChange(value: string) {
    const sacos = sacosFromKg(value)
    patch({
      quantity_kg: value,
      ...(sacos != null ? { units_count: String(sacos) } : {}),
    })
  }

  function handleSacosChange(value: string) {
    const kg = kgFromSacos(value)
    patch({
      units_count: value,
      ...(kg != null ? { quantity_kg: String(kg) } : {}),
    })
  }

  const generatedSku = buildSkuFromTypeBrand(
    form.product_type,
    form.brand,
    form.container_number,
  )

  return (
    <>
      <FormSectionCard
        title={MATERIAL_LABELS.sections.classification}
        description={MATERIAL_LABELS.sections.classificationHint}
        action={<SectionStep n={1} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField htmlFor="material-category" label={MATERIAL_LABELS.fields.category} icon={Layers}>
            <select
              id="material-category"
              className={productionSelectClassName}
              value={form.inventory_area}
              onChange={(e) => patch({ inventory_area: e.target.value })}
            >
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {fieldErrors.inventory_area ? (
              <p className="text-xs text-rose-600">{fieldErrors.inventory_area}</p>
            ) : null}
          </LabeledField>

          <LabeledField htmlFor="material-unit" label={MATERIAL_LABELS.fields.unit} icon={Ruler}>
            <Input
              id="material-unit"
              value={DEFAULT_UNIT}
              readOnly
              className="border-slate-200 bg-slate-50 font-medium text-slate-700"
            />
          </LabeledField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField htmlFor="material-type" label={MATERIAL_LABELS.fields.productType} icon={Hash}>
            <Input
              id="material-type"
              value={form.product_type}
              maxLength={64}
              required
              placeholder="3003, 11PG1…"
              onChange={(e) => patch({ product_type: e.target.value })}
            />
            {fieldErrors.product_type ? (
              <p className="text-xs text-rose-600">{fieldErrors.product_type}</p>
            ) : null}
          </LabeledField>

          <LabeledField htmlFor="material-brand" label={MATERIAL_LABELS.fields.brand} icon={Tag}>
            <Input
              id="material-brand"
              value={form.brand}
              maxLength={128}
              required
              placeholder="Synpol, Petrothene…"
              onChange={(e) => patch({ brand: e.target.value })}
            />
            {fieldErrors.brand ? (
              <p className="text-xs text-rose-600">{fieldErrors.brand}</p>
            ) : null}
          </LabeledField>
        </div>

        {generatedSku ? (
          <p className="rounded-lg border border-violet-200/70 bg-violet-50/50 px-3 py-2 text-xs text-violet-900">
            {MATERIAL_LABELS.fields.sku}: <span className="font-mono font-semibold">{generatedSku}</span>
            <span className="ml-2 text-violet-700">({MATERIAL_LABELS.hints.skuAuto})</span>
          </p>
        ) : null}
      </FormSectionCard>

      <FormSectionCard
        title={MATERIAL_LABELS.sections.stock}
        description={MATERIAL_LABELS.sections.stockHint}
        action={<SectionStep n={2} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField htmlFor="material-kg" label={MATERIAL_LABELS.fields.quantityKg} icon={Scale}>
            <Input
              id="material-kg"
              value={form.quantity_kg}
              inputMode="decimal"
              required
              placeholder={MATERIAL_LABELS.placeholders.quantityKg}
              onChange={(e) => handleKgChange(e.target.value)}
            />
            {fieldErrors.quantity_kg ? (
              <p className="text-xs text-rose-600">{fieldErrors.quantity_kg}</p>
            ) : null}
          </LabeledField>

          <LabeledField htmlFor="material-sacos" label={MATERIAL_LABELS.fields.unitsCount} icon={Package}>
            <Input
              id="material-sacos"
              value={form.units_count}
              inputMode="decimal"
              required
              placeholder={MATERIAL_LABELS.placeholders.unitsCount}
              onChange={(e) => handleSacosChange(e.target.value)}
            />
            <p className="text-xs text-slate-500">{MATERIAL_LABELS.hints.sacoWeight}</p>
            {fieldErrors.units_count ? (
              <p className="text-xs text-rose-600">{fieldErrors.units_count}</p>
            ) : null}
          </LabeledField>
        </div>
      </FormSectionCard>

      <FormSectionCard
        title={MATERIAL_LABELS.sections.entry}
        description={MATERIAL_LABELS.sections.entryHint}
        action={<SectionStep n={3} />}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <LabeledField htmlFor="material-supplier" label={MATERIAL_LABELS.fields.supplier} icon={Truck}>
            <select
              id="material-supplier"
              className={productionSelectClassName}
              value={form.supplier_id}
              disabled={loadingSuppliers}
              onChange={(e) => patch({ supplier_id: e.target.value })}
            >
              <option value="">{MATERIAL_LABELS.supplierSelect}</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </option>
              ))}
            </select>
            {fieldErrors.supplier_id ? (
              <p className="text-xs text-rose-600">{fieldErrors.supplier_id}</p>
            ) : null}
          </LabeledField>

          <LabeledField
            htmlFor="material-container"
            label={MATERIAL_LABELS.fields.containerNumber}
            icon={Box}
          >
            <Input
              id="material-container"
              value={form.container_number}
              maxLength={64}
              placeholder={MATERIAL_LABELS.placeholders.containerNumber}
              onChange={(e) => patch({ container_number: e.target.value })}
            />
            {fieldErrors.container_number ? (
              <p className="text-xs text-rose-600">{fieldErrors.container_number}</p>
            ) : null}
          </LabeledField>
        </div>
        <p className="text-xs text-slate-500">{MATERIAL_LABELS.hints.entryFields}</p>
      </FormSectionCard>

      <FormSectionCard
        title={MATERIAL_LABELS.sections.notes}
        description={MATERIAL_LABELS.sections.notesHint}
        action={<SectionStep n={4} />}
      >
        <LabeledField htmlFor="material-notes" label={MATERIAL_LABELS.fields.notes} icon={MessageSquareText}>
          <textarea
            id="material-notes"
            className="flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500"
            value={form.notes}
            placeholder={MATERIAL_LABELS.placeholders.notes}
            onChange={(e) => patch({ notes: e.target.value })}
          />
          {fieldErrors.notes ? (
            <p className="text-xs text-rose-600">{fieldErrors.notes}</p>
          ) : null}
        </LabeledField>
      </FormSectionCard>

      {isEdit ? (
        <FormSectionCard
          title={MATERIAL_LABELS.sections.audit}
          description={MATERIAL_LABELS.sections.auditHint}
          className="border-amber-200/80 bg-amber-50/30"
          action={<SectionStep n={5} />}
        >
          <LabeledField
            htmlFor="material-change-reason"
            label={MATERIAL_LABELS.fields.changeReason}
            icon={FilePenLine}
          >
            <Input
              id="material-change-reason"
              value={form.change_reason}
              maxLength={500}
              placeholder={MATERIAL_LABELS.placeholders.changeReason}
              onChange={(e) => patch({ change_reason: e.target.value })}
            />
            {fieldErrors.change_reason ? (
              <p className="text-xs text-rose-600">{fieldErrors.change_reason}</p>
            ) : null}
          </LabeledField>
        </FormSectionCard>
      ) : null}
    </>
  )
}
