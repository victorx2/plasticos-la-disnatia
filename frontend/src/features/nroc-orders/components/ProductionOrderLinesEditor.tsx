import { Plus, Trash2 } from "lucide-react"

import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { LineDraft } from "@/features/nroc-orders/hooks/useNrocOrderForm"
import type { Product } from "@/features/masters/products/types"
import {
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

const selectClassName =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 disabled:bg-slate-50 disabled:text-slate-500"

type ProductionOrderLinesEditorProps = {
  lines: LineDraft[]
  products: Product[]
  clientId: string
  loadingProducts: boolean
  readOnly: boolean
  fieldErrors: Record<string, string>
  onAddLine: () => void
  onRemoveLine: (key: string) => void
  onUpdateLine: (key: string, partial: Partial<LineDraft>) => void
  showHeader?: boolean
}

function unitOptionsForLine(unit: string) {
  const known = PRODUCTION_ORDER_LABELS.lineUnits
  if (known.some((opt) => opt.value === unit)) return known
  return [...known, { value: unit, label: unit }]
}

export function ProductionOrderLinesEditor({
  lines,
  products,
  clientId,
  loadingProducts,
  readOnly,
  fieldErrors,
  onAddLine,
  onRemoveLine,
  onUpdateLine,
  showHeader = true,
}: ProductionOrderLinesEditorProps) {
  const colCount = readOnly ? 5 : 6

  return (
    <div className="space-y-3">
      {showHeader ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">{PRODUCTION_ORDER_LABELS.linesTitle}</h3>
          {!readOnly ? (
            <Button type="button" variant="outline" size="sm" onClick={onAddLine}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {PRODUCTION_ORDER_LABELS.addLine}
            </Button>
          ) : null}
        </div>
      ) : null}

      {fieldErrors.lines ? (
        <p className="text-xs text-rose-600">{fieldErrors.lines}</p>
      ) : null}

      {!clientId && !readOnly ? (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
          {PRODUCTION_ORDER_LABELS.linesClientHint}
        </p>
      ) : null}

      <CatalogTablePanel minWidth="720px">
        <CatalogTableHeader>
          <CatalogTableHeadRow>
            <CatalogTableHead className="w-12">{PRODUCTION_ORDER_LABELS.linesTable.item}</CatalogTableHead>
            <CatalogTableHead className="min-w-[12rem]">
              {PRODUCTION_ORDER_LABELS.linesTable.product}
            </CatalogTableHead>
            <CatalogTableHead className="w-32">{PRODUCTION_ORDER_LABELS.linesTable.quantity}</CatalogTableHead>
            <CatalogTableHead className="w-36">{PRODUCTION_ORDER_LABELS.linesTable.unit}</CatalogTableHead>
            <CatalogTableHead className="min-w-[10rem]">
              {PRODUCTION_ORDER_LABELS.linesTable.description}
            </CatalogTableHead>
            {!readOnly ? <CatalogTableHead className="w-12" /> : null}
          </CatalogTableHeadRow>
        </CatalogTableHeader>
        <CatalogTableBody>
          {lines.map((line, index) => (
            <CatalogTableRow key={line.key}>
              <CatalogTableCell className="tabular-nums text-xs text-slate-400">{index + 1}</CatalogTableCell>
              <CatalogTableCell className="align-top">
                <select
                  className={selectClassName}
                  value={line.product_id}
                  disabled={!clientId || loadingProducts || readOnly}
                  onChange={(e) => onUpdateLine(line.key, { product_id: e.target.value })}
                >
                  <option value="">{PRODUCTION_ORDER_LABELS.productSelect}</option>
                  {products.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {fieldErrors[`line-${line.key}-product`] ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {fieldErrors[`line-${line.key}-product`]}
                  </p>
                ) : null}
              </CatalogTableCell>
              <CatalogTableCell className="align-top">
                <Input
                  inputMode="decimal"
                  className="h-9 min-w-[5rem]"
                  value={line.quantity}
                  disabled={readOnly || !clientId}
                  onChange={(e) => onUpdateLine(line.key, { quantity: e.target.value })}
                />
                {fieldErrors[`line-${line.key}-quantity`] ? (
                  <p className="mt-1 text-xs text-rose-600">
                    {PRODUCTION_ORDER_LABELS.validation.quantity}
                  </p>
                ) : null}
              </CatalogTableCell>
              <CatalogTableCell className="align-top">
                <select
                  className={selectClassName}
                  value={line.unit}
                  disabled={readOnly || !clientId}
                  onChange={(e) => onUpdateLine(line.key, { unit: e.target.value })}
                >
                  {unitOptionsForLine(line.unit).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </CatalogTableCell>
              <CatalogTableCell className="align-top">
                <Input
                  className="h-9"
                  value={line.description}
                  disabled={readOnly || !clientId}
                  onChange={(e) => onUpdateLine(line.key, { description: e.target.value })}
                />
              </CatalogTableCell>
              {!readOnly ? (
                <CatalogTableCell className="align-top text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-rose-600"
                    disabled={lines.length <= 1}
                    onClick={() => onRemoveLine(line.key)}
                    aria-label={PRODUCTION_ORDER_LABELS.removeLine}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </CatalogTableCell>
              ) : null}
            </CatalogTableRow>
          ))}
          {!lines.length ? (
            <CatalogTableRow className="hover:bg-transparent">
              <CatalogTableCell colSpan={colCount} className="py-8 text-center text-sm text-slate-500">
                {PRODUCTION_ORDER_LABELS.linesEmpty}
              </CatalogTableCell>
            </CatalogTableRow>
          ) : null}
        </CatalogTableBody>
      </CatalogTablePanel>
    </div>
  )
}
