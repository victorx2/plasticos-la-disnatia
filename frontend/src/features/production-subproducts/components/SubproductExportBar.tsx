import { FileSpreadsheet, FileText, Printer, Table2 } from "lucide-react"

import { SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import {
  inventoryClientLabel,
  inventoryOrderLabel,
} from "@/features/production-subproducts/lib/inventoryRowLabel"
import { openSubproductPrint } from "@/features/production-subproducts/lib/subproductPrint"
import { downloadTableExport } from "@/shared/export/exportTable"
import type { ExportFormat } from "@/shared/export/types"
import { Button } from "@/shared/ui/button"

type SubproductExportBarProps = {
  title: string
  slug: string
  headers: string[]
  rows: string[][]
  disabled?: boolean
}

export function SubproductExportBar({ title, slug, headers, rows, disabled }: SubproductExportBarProps) {
  const canExport = !disabled && rows.length > 0

  function exportTable(format: ExportFormat) {
    downloadTableExport(format, { title, slug, headers, rows })
  }

  function handlePrint() {
    openSubproductPrint(
      title,
      headers,
      rows.map((cells) => ({ cells })),
    )
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" variant="outline" disabled={!canExport} onClick={() => exportTable("pdf")}>
        <FileText className="h-3.5 w-3.5" aria-hidden />
        {SUBPRODUCTS_LABELS.exportPdf}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canExport} onClick={() => exportTable("csv")}>
        <Table2 className="h-3.5 w-3.5" aria-hidden />
        {SUBPRODUCTS_LABELS.exportCsv}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canExport} onClick={() => exportTable("xls")}>
        <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
        {SUBPRODUCTS_LABELS.exportXls}
      </Button>
      <Button type="button" size="sm" variant="outline" disabled={!canExport} onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5" aria-hidden />
        {SUBPRODUCTS_LABELS.exportPrint}
      </Button>
    </div>
  )
}

export function buildInventoryExport(
  items: Array<{
    entry_kind?: string
    description?: string | null
    measure?: string | null
    client_order_code?: string | null
    work_order_code?: string | null
    work_order_id?: number | null
    client_name?: string | null
    production_kg?: string | null
    manual_kg?: string | null
    produced_kg: string
    dispatched_kg: string
    pending_kg: string
  }>,
  options?: { includeMeasure?: boolean; stockByMeasure?: boolean },
) {
  const stockByMeasure = options?.stockByMeasure ?? false
  const includeMeasure = options?.includeMeasure ?? false
  const headers = stockByMeasure
    ? [
        SUBPRODUCTS_LABELS.columns.measure,
        SUBPRODUCTS_LABELS.columns.stockOrigin,
        `${SUBPRODUCTS_LABELS.columns.registered} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.dispatched} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.pending} (kg)`,
      ]
    : [
        SUBPRODUCTS_LABELS.columns.order,
        SUBPRODUCTS_LABELS.columns.client,
        ...(includeMeasure ? [SUBPRODUCTS_LABELS.columns.measure] : []),
        `${SUBPRODUCTS_LABELS.columns.registered} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.dispatched} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.pending} (kg)`,
      ]
  const rows = items.map((item) =>
    stockByMeasure
      ? [
          inventoryOrderLabel(item),
          inventoryClientLabel(item) ?? "—",
          item.produced_kg,
          item.dispatched_kg,
          item.pending_kg,
        ]
      : [
          inventoryOrderLabel(item),
          inventoryClientLabel(item) ?? item.client_name ?? "—",
          ...(includeMeasure ? [item.measure?.trim() || "—"] : []),
          item.produced_kg,
          item.dispatched_kg,
          item.pending_kg,
        ],
  )
  return { headers, rows }
}

export function buildInDispatchExport(
  items: Array<{
    item_key: string
    manual_entry_id?: number | null
    description?: string | null
    measure?: string | null
    client_order_code?: string | null
    work_order_code?: string | null
    work_order_id?: number | null
    client_name?: string | null
    in_dispatch_kg: string
    shipped_kg: string
    released_kg: string
  }>,
  options?: { includeMeasure?: boolean; stockByMeasure?: boolean },
) {
  const stockByMeasure = options?.stockByMeasure ?? false
  const includeMeasure = options?.includeMeasure ?? false
  const headers = stockByMeasure
    ? [
        SUBPRODUCTS_LABELS.columns.measure,
        `${SUBPRODUCTS_LABELS.columnsInDispatch.inDispatch} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.dispatched} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.released} (kg)`,
      ]
    : [
        SUBPRODUCTS_LABELS.columns.order,
        SUBPRODUCTS_LABELS.columns.client,
        ...(includeMeasure ? [SUBPRODUCTS_LABELS.columns.measure] : []),
        `${SUBPRODUCTS_LABELS.columnsInDispatch.inDispatch} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.dispatched} (kg)`,
        `${SUBPRODUCTS_LABELS.columns.released} (kg)`,
      ]
  const rows = items.map((item) => {
    const entryKind = item.manual_entry_id != null ? "manual" : "production"
    return stockByMeasure
      ? [
          item.measure?.trim() || "—",
          item.in_dispatch_kg,
          item.shipped_kg,
          item.released_kg,
        ]
      : [
          inventoryOrderLabel({
            entry_kind: entryKind,
            description: item.description,
            client_order_code: item.client_order_code,
            work_order_code: item.work_order_code,
            work_order_id: item.work_order_id,
          }),
          inventoryClientLabel({ entry_kind: entryKind }) ?? item.client_name ?? "—",
          ...(includeMeasure ? [item.measure?.trim() || "—"] : []),
          item.in_dispatch_kg,
          item.shipped_kg,
          item.released_kg,
        ]
  })
  return { headers, rows }
}
