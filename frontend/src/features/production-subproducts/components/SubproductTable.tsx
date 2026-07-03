import { SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { formatKgDisplay } from "@/shared/format/numbers"

export type SubproductRow = {
  key: string
  workOrderId?: number | null
  manualEntryId?: number | null
  order: string
  client?: string | null
  measure?: string | null
  detail: string | null
  produced: string
  dispatched: string
  pending: string
}

type SubproductTableProps = {
  rows: SubproductRow[]
  kgByKey: Record<string, string>
  reasonByKey: Record<string, string>
  shippingKey: string | null
  stockByMeasure?: boolean
  showMeasureColumn?: boolean
  onKgChange: (key: string, value: string) => void
  onReasonChange: (key: string, value: string) => void
  onShip: (row: SubproductRow) => void
}

export function SubproductTable({
  rows,
  kgByKey,
  reasonByKey,
  shippingKey,
  stockByMeasure = false,
  showMeasureColumn = false,
  onKgChange,
  onReasonChange,
  onShip,
}: SubproductTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2.5">
              {stockByMeasure ? SUBPRODUCTS_LABELS.columns.measure : SUBPRODUCTS_LABELS.columns.order}
            </th>
            <th className="px-3 py-2.5">
              {stockByMeasure ? SUBPRODUCTS_LABELS.columns.stockOrigin : SUBPRODUCTS_LABELS.columns.client}
            </th>
            {!stockByMeasure && showMeasureColumn ? (
              <th className="px-3 py-2.5">{SUBPRODUCTS_LABELS.columns.measure}</th>
            ) : null}
            <th className="px-3 py-2.5 text-right">{SUBPRODUCTS_LABELS.columns.registered}</th>
            <th className="px-3 py-2.5 text-right">{SUBPRODUCTS_LABELS.columns.dispatched}</th>
            <th className="px-3 py-2.5 text-right">{SUBPRODUCTS_LABELS.columns.pending}</th>
            <th className="px-3 py-2.5">Envío</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const pending = Number(row.pending)
            const canShip = pending > 0
            const isShipping = shippingKey === row.key
            return (
              <tr key={row.key} className="align-top bg-white">
                <td className="px-3 py-3 font-medium text-violet-800">{row.order}</td>
                <td className="px-3 py-3 text-slate-700">
                  <div>{row.client ?? "—"}</div>
                  {row.detail ? <div className="mt-1 text-xs text-slate-500">{row.detail}</div> : null}
                </td>
                {showMeasureColumn && !stockByMeasure ? (
                  <td className="px-3 py-3 text-slate-700">{row.measure?.trim() || "—"}</td>
                ) : null}
                <td className="px-3 py-3 text-right tabular-nums">{formatKgDisplay(row.produced)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatKgDisplay(row.dispatched)}</td>
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-800">
                  {formatKgDisplay(row.pending)}
                </td>
                <td className="px-3 py-3">
                  {canShip ? (
                    <div className="flex min-w-[14rem] flex-col gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-8 text-right tabular-nums"
                        placeholder={SUBPRODUCTS_LABELS.placeholders.kg}
                        value={kgByKey[row.key] ?? ""}
                        onChange={(e) => onKgChange(row.key, e.target.value)}
                      />
                      <Input
                        type="text"
                        className="h-8"
                        placeholder={SUBPRODUCTS_LABELS.placeholders.reason}
                        value={reasonByKey[row.key] ?? ""}
                        onChange={(e) => onReasonChange(row.key, e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isShipping}
                        className={cn("w-full")}
                        onClick={() => onShip(row)}
                      >
                        {isShipping ? SUBPRODUCTS_LABELS.shipping : SUBPRODUCTS_LABELS.ship}
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
