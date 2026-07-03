import { Package, Ruler, Scale, Tag } from "lucide-react"

import type { Material } from "@/features/materials/types"
import {
  allowedUnitsForItemType,
  itemTypeFromInventoryArea,
  itemTypeLabel,
  itemTypeRequiresDimensions,
} from "@/features/purchase-receipts/item-type"
import { PURCHASE_RECEIPT_LABELS } from "@/features/purchase-receipts/labels"
import type { ReceiptLineForm } from "@/features/purchase-receipts/hooks/usePurchaseReceiptForm"
import { productionSelectClassName } from "@/features/production/shared/formUi"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { cn } from "@/shared/lib/utils"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

type PurchaseReceiptLinesEditorProps = {
  lines: ReceiptLineForm[]
  materials: Material[]
  fieldErrors: Record<string, string>
  onPatchLine: (key: string, partial: Partial<ReceiptLineForm>) => void
}

function materialOptions(materials: Material[]): Material[] {
  return materials
}

export function PurchaseReceiptLinesEditor({
  lines,
  materials,
  fieldErrors,
  onPatchLine,
}: PurchaseReceiptLinesEditorProps) {
  if (!lines.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
        No hay líneas pendientes en esta orden de compra.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {fieldErrors.lines ? (
        <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
      ) : null}

      {lines.map((line, index) => {
        const units = allowedUnitsForItemType(line.item_type)
        const showDims = itemTypeRequiresDimensions(line.item_type)
        const mat = materials.find((m) => String(m.id) === line.material_id)

        return (
          <div
            key={line.key}
            className={cn(
              "space-y-3 rounded-xl border p-4 shadow-sm",
              line.included
                ? "border-violet-200/70 bg-white ring-1 ring-violet-100/80"
                : "border-slate-200 bg-slate-50/60 opacity-80",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                  <Package className="h-3 w-3" aria-hidden />
                  Línea {index + 1}
                </span>
                <p className="text-sm font-medium text-slate-900">
                  {line.description || `Línea OC #${line.purchase_order_line_id}`}
                </p>
                <p className="text-xs text-slate-500">
                  {PURCHASE_RECEIPT_LABELS.fields.pending}: {line.pending_qty.toFixed(3)} {line.unit}
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                  checked={line.included}
                  onChange={(e) => onPatchLine(line.key, { included: e.target.checked })}
                />
                Incluir en recepción
              </label>
            </div>

            {line.included ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <LabeledField
                    htmlFor={`rec-material-${line.key}`}
                    label={PURCHASE_RECEIPT_LABELS.fields.material}
                    icon={Tag}
                  >
                    <select
                      id={`rec-material-${line.key}`}
                      className={productionSelectClassName}
                      value={line.material_id}
                      required
                      onChange={(e) => {
                        const selected = materials.find((m) => String(m.id) === e.target.value)
                        onPatchLine(line.key, {
                          material_id: e.target.value,
                          item_type: selected
                            ? itemTypeFromInventoryArea(selected.inventory_area)
                            : line.item_type,
                          micras: selected?.micras ?? line.micras,
                          ancho_mm: selected?.ancho ?? line.ancho_mm,
                          unit: selected?.unit ?? line.unit,
                        })
                      }}
                    >
                      <option value="">{PURCHASE_RECEIPT_LABELS.placeholders.materialEmpty}</option>
                      {materialOptions(materials).map((material) => (
                        <option key={material.id} value={String(material.id)}>
                          {material.sku} · {material.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors[`lines.${index}.material_id`] ? (
                      <p className="text-xs text-rose-600">{fieldErrors[`lines.${index}.material_id`]}</p>
                    ) : null}
                  </LabeledField>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {PURCHASE_RECEIPT_LABELS.fields.itemType}
                    </Label>
                    <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {itemTypeLabel(line.item_type)}
                    </p>
                    {mat ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {mat.sku} · {mat.name}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <LabeledField
                    htmlFor={`rec-qty-${line.key}`}
                    label={PURCHASE_RECEIPT_LABELS.fields.quantity}
                    icon={Scale}
                  >
                    <Input
                      id={`rec-qty-${line.key}`}
                      inputMode="decimal"
                      value={line.quantity}
                      placeholder={PURCHASE_RECEIPT_LABELS.placeholders.quantity}
                      onChange={(e) => onPatchLine(line.key, { quantity: e.target.value })}
                    />
                    {fieldErrors[`lines.${index}.quantity`] ? (
                      <p className="text-xs text-rose-600">{fieldErrors[`lines.${index}.quantity`]}</p>
                    ) : null}
                  </LabeledField>

                  <LabeledField
                    htmlFor={`rec-unit-${line.key}`}
                    label={PURCHASE_RECEIPT_LABELS.fields.unit}
                    icon={Ruler}
                  >
                    <select
                      id={`rec-unit-${line.key}`}
                      className={productionSelectClassName}
                      value={line.unit}
                      onChange={(e) => onPatchLine(line.key, { unit: e.target.value })}
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </LabeledField>
                </div>

                {showDims ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <LabeledField htmlFor={`rec-micras-${line.key}`} label={PURCHASE_RECEIPT_LABELS.fields.micras}>
                      <Input
                        id={`rec-micras-${line.key}`}
                        inputMode="decimal"
                        value={line.micras}
                        placeholder="Ej. 25"
                        onChange={(e) => onPatchLine(line.key, { micras: e.target.value })}
                      />
                    </LabeledField>
                    <LabeledField htmlFor={`rec-ancho-${line.key}`} label={PURCHASE_RECEIPT_LABELS.fields.ancho}>
                      <Input
                        id={`rec-ancho-${line.key}`}
                        inputMode="decimal"
                        value={line.ancho_mm}
                        placeholder="Ej. 1200"
                        onChange={(e) => onPatchLine(line.key, { ancho_mm: e.target.value })}
                      />
                    </LabeledField>
                    {fieldErrors[`lines.${index}.dimensions`] ? (
                      <p className="text-xs text-rose-600 sm:col-span-2">
                        {fieldErrors[`lines.${index}.dimensions`]}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
