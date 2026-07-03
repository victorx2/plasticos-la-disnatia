import { SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import {
  inventoryClientLabel,
  inventoryOrderLabel,
} from "@/features/production-subproducts/lib/inventoryRowLabel"
import type { SubproductInDispatch } from "@/features/production-subproducts/types"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { formatKgDisplay } from "@/shared/format/numbers"

export function SubproductReleaseTable({
  rows,
  kgByKey,
  reasonByKey,
  releasingKey,
  stockByMeasure = false,
  showMeasureColumn = false,
  onKgChange,
  onReasonChange,
  onRelease,
}: {
  rows: SubproductInDispatch[]
  kgByKey: Record<string, string>
  reasonByKey: Record<string, string>
  releasingKey: string | null
  stockByMeasure?: boolean
  showMeasureColumn?: boolean
  onKgChange: (key: string, value: string) => void
  onReasonChange: (key: string, value: string) => void
  onRelease: (row: SubproductInDispatch, key: string) => void
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
        {SUBPRODUCTS_LABELS.emptyInDispatch}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-3 py-2.5">
              {stockByMeasure ? SUBPRODUCTS_LABELS.columns.measure : SUBPRODUCTS_LABELS.columns.order}
            </th>
            {!stockByMeasure ? (
              <th className="px-3 py-2.5">{SUBPRODUCTS_LABELS.columns.client}</th>
            ) : null}
            {!stockByMeasure && showMeasureColumn ? (
              <th className="px-3 py-2.5">{SUBPRODUCTS_LABELS.columns.measure}</th>
            ) : null}
            <th className="px-3 py-2.5 text-right">{SUBPRODUCTS_LABELS.columnsInDispatch.inDispatch}</th>
            <th className="px-3 py-2.5">{SUBPRODUCTS_LABELS.columnsInDispatch.release}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const key = row.item_key
            const order = stockByMeasure
              ? row.measure?.trim() || "—"
              : inventoryOrderLabel({
                  entry_kind: row.manual_entry_id != null ? "manual" : "production",
                  description: row.description,
                  client_order_code: row.client_order_code,
                  work_order_code: row.work_order_code,
                  work_order_id: row.work_order_id,
                })
            const client = stockByMeasure
              ? null
              : inventoryClientLabel({ entry_kind: row.manual_entry_id != null ? "manual" : "production" }) ??
                row.client_name ??
                "—"
            const inDispatch = Number(row.in_dispatch_kg)
            return (
              <tr key={key} className="align-top bg-white">
                <td className="px-3 py-3 font-medium text-violet-800">{order}</td>
                {!stockByMeasure ? <td className="px-3 py-3 text-slate-700">{client}</td> : null}
                {showMeasureColumn && !stockByMeasure ? (
                  <td className="px-3 py-3 text-slate-700">{row.measure?.trim() || "—"}</td>
                ) : null}
                <td className="px-3 py-3 text-right font-semibold tabular-nums text-amber-800">
                  {formatKgDisplay(row.in_dispatch_kg)}
                </td>
                <td className="px-3 py-3">
                  {inDispatch > 0 ? (
                    <div className="flex min-w-[14rem] flex-col gap-2">
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-8 text-right tabular-nums"
                        placeholder={SUBPRODUCTS_LABELS.releasePlaceholder}
                        value={kgByKey[key] ?? ""}
                        onChange={(e) => onKgChange(key, e.target.value)}
                      />
                      <Input
                        type="text"
                        className="h-8"
                        placeholder={SUBPRODUCTS_LABELS.releaseReason}
                        value={reasonByKey[key] ?? ""}
                        onChange={(e) => onReasonChange(key, e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={releasingKey === key}
                        className={cn("w-full")}
                        onClick={() => onRelease(row, key)}
                      >
                        {releasingKey === key
                          ? SUBPRODUCTS_LABELS.releasing
                          : SUBPRODUCTS_LABELS.release}
                      </Button>
                    </div>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
