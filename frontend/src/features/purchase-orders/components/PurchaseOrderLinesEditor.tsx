import { Plus, Trash2 } from "lucide-react"

import type { Material } from "@/features/materials/types"
import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import type { PurchaseOrderLineForm } from "@/features/purchase-orders/hooks/usePurchaseOrderForm"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

const LINE_UNITS = ["kg", "unidad", "m", "rollo", "otros"] as const

type PurchaseOrderLinesEditorProps = {
  lines: PurchaseOrderLineForm[]
  materials: Material[]
  loadingMaterials: boolean
  fieldErrors: Record<string, string>
  onPatchLine: (key: string, partial: Partial<PurchaseOrderLineForm>) => void
  onAddLine: () => void
  onRemoveLine: (key: string) => void
}

function materialLabel(material: Material): string {
  return `${material.sku} · ${material.name}`
}

export function PurchaseOrderLinesEditor({
  lines,
  materials,
  loadingMaterials,
  fieldErrors,
  onPatchLine,
  onAddLine,
  onRemoveLine,
}: PurchaseOrderLinesEditorProps) {
  function handleMaterialChange(key: string, materialId: string) {
    const material = materials.find((m) => String(m.id) === materialId)
    onPatchLine(key, {
      material_id: materialId,
      description: material?.name ?? "",
      unit: material?.unit ?? "kg",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">
          {PURCHASE_ORDER_LABELS.linesSection}
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          {PURCHASE_ORDER_LABELS.addLine}
        </Button>
      </div>

      {fieldErrors.lines ? (
        <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
      ) : null}

      <div className="space-y-3">
        {lines.map((line, index) => {
          const received = line.quantity_received
          const hasReceived = received != null && Number(received) > 0

          return (
            <div
              key={line.key}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">Línea {index + 1}</span>
                {lines.length > 1 && !hasReceived ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => onRemoveLine(line.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {PURCHASE_ORDER_LABELS.removeLine}
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`po-line-material-${line.key}`}>
                    {PURCHASE_ORDER_LABELS.fields.material}
                  </Label>
                  <select
                    id={`po-line-material-${line.key}`}
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={line.material_id}
                    disabled={loadingMaterials}
                    onChange={(e) => handleMaterialChange(line.key, e.target.value)}
                  >
                    <option value="">{PURCHASE_ORDER_LABELS.materialSelect}</option>
                    {materials.map((material) => (
                      <option key={material.id} value={String(material.id)}>
                        {materialLabel(material)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor={`po-line-desc-${line.key}`}>
                    {PURCHASE_ORDER_LABELS.fields.description}
                  </Label>
                  <Input
                    id={`po-line-desc-${line.key}`}
                    className="mt-1.5"
                    value={line.description}
                    onChange={(e) => onPatchLine(line.key, { description: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor={`po-line-qty-${line.key}`}>
                    {PURCHASE_ORDER_LABELS.fields.quantity}
                  </Label>
                  <Input
                    id={`po-line-qty-${line.key}`}
                    className="mt-1.5"
                    inputMode="decimal"
                    value={line.quantity_ordered}
                    onChange={(e) => onPatchLine(line.key, { quantity_ordered: e.target.value })}
                  />
                  {hasReceived ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Recibido: {received}
                    </p>
                  ) : null}
                </div>

                <div>
                  <Label htmlFor={`po-line-unit-${line.key}`}>
                    {PURCHASE_ORDER_LABELS.fields.unit}
                  </Label>
                  <select
                    id={`po-line-unit-${line.key}`}
                    className="mt-1.5 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                    value={line.unit}
                    onChange={(e) => onPatchLine(line.key, { unit: e.target.value })}
                  >
                    {LINE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor={`po-line-price-${line.key}`}>
                    {PURCHASE_ORDER_LABELS.fields.unitPrice}
                  </Label>
                  <Input
                    id={`po-line-price-${line.key}`}
                    className="mt-1.5"
                    inputMode="decimal"
                    value={line.unit_price}
                    onChange={(e) => onPatchLine(line.key, { unit_price: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
