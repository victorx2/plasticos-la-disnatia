import { Link } from "react-router-dom"
import { PackageOpen, Plus } from "lucide-react"

import { INVENTORY_RETURN_LABELS, tabHint } from "@/features/inventory-returns/labels"
import { useInventoryReturnsList } from "@/features/inventory-returns/hooks/useInventoryReturnsList"
import type { InventoryReturn } from "@/features/inventory-returns/types"
import { extrusionShiftLabel } from "@/features/production/extrusion/labels"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"
import { PageShell } from "@/shared/catalog/PageShell"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import type { ReturnKindTab } from "@/features/inventory-returns/types"

function returnKindLabel(area: string): string {
  if (area === "bobinas_rechazadas") return INVENTORY_RETURN_LABELS.kind.rejected
  if (area === "fallas") return INVENTORY_RETURN_LABELS.kind.fallas
  return INVENTORY_RETURN_LABELS.kind.good
}

function returnKindClass(area: string): string {
  if (area === "bobinas_rechazadas") return "bg-rose-50 text-rose-700"
  if (area === "fallas") return "bg-amber-50 text-amber-800"
  return "bg-emerald-50 text-emerald-700"
}

function opCode(row: InventoryReturn): string {
  if (row.work_order?.code) return row.work_order.code
  if (row.work_order_id) return `OP #${row.work_order_id}`
  return "—"
}

function productLabel(row: InventoryReturn): string {
  return row.product_label ?? row.material?.name ?? "—"
}

function shiftLabel(row: InventoryReturn): string {
  if (!row.shift) return "—"
  return extrusionShiftLabel(row.shift)
}

function canReleaseToMaterials(row: InventoryReturn): boolean {
  return row.destination_area === "fallas" || row.destination_area === "bobinas_rechazadas"
}

const stickyActionHeadClass =
  "sticky right-0 z-20 bg-slate-50/95 shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.12)]"
const stickyActionCellClass =
  "sticky right-0 z-10 bg-white shadow-[-6px_0_10px_-6px_rgba(15,23,42,0.08)] group-hover:bg-slate-50/60"

export function InventoryReturnsListPage() {
  const {
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    showInitialSkeleton,
    kindTab,
    setKindTab,
    acceptingId,
    acceptReturn,
    releasingId,
    releaseToMaterials,
  } = useInventoryReturnsList()

  const total = rows?.total ?? 0

  const newButton = (
    <Button type="button" asChild>
      <Link to="/devoluciones/nueva">
        <Plus className="h-4 w-4" aria-hidden />
        {INVENTORY_RETURN_LABELS.newReturn}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={INVENTORY_RETURN_LABELS.listTitle}
      subtitle={INVENTORY_RETURN_LABELS.listSubtitle}
      icon={PackageOpen}
      action={newButton}
    >
      <div className="space-y-4">
        <CatalogViewTabs
          tabs={[
            { id: "all", label: INVENTORY_RETURN_LABELS.tabs.all },
            { id: "good", label: INVENTORY_RETURN_LABELS.tabs.good },
            { id: "rejected", label: INVENTORY_RETURN_LABELS.tabs.rejected },
            { id: "fallas", label: INVENTORY_RETURN_LABELS.tabs.fallas },
            { id: "tintas", label: INVENTORY_RETURN_LABELS.tabs.tintas },
          ]}
          value={kindTab}
          onChange={(id) => setKindTab(id as ReturnKindTab)}
        />

        <p className="text-xs text-slate-500">{tabHint(kindTab)}</p>
        <p className="text-xs font-medium text-violet-700">{INVENTORY_RETURN_LABELS.scrollActionsHint}</p>

        <CatalogTablePanel minWidth="880px">
          <CatalogTableHeader>
            <CatalogTableHeadRow>
              <CatalogTableHead className="w-14">{INVENTORY_RETURN_LABELS.table.number}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_RETURN_LABELS.fields.op}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_RETURN_LABELS.fields.product}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_RETURN_LABELS.fields.shift}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_RETURN_LABELS.fields.kg}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_RETURN_LABELS.fields.kind}</CatalogTableHead>
              <CatalogTableHead align="right" className={stickyActionHeadClass}>
                {INVENTORY_RETURN_LABELS.table.actions}
              </CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>

          <CatalogTableBody>
            {showInitialSkeleton ? (
              <CatalogLoadingRows colSpan={7} />
            ) : !rows?.data.length ? (
              <CatalogEmptyRows colSpan={7}>
                <CatalogEmptyState
                  compact
                  icon={PackageOpen}
                  title={INVENTORY_RETURN_LABELS.emptyTitle}
                  description={INVENTORY_RETURN_LABELS.emptyDescription}
                  action={newButton}
                />
              </CatalogEmptyRows>
            ) : (
              rows.data.map((row, index) => {
                const n = catalogRowNumber(rows.current_page, rows.per_page, index)
                const kindLabel = returnKindLabel(row.destination_area)
                const kindClass = returnKindClass(row.destination_area)
                const releaseable = canReleaseToMaterials(row)
                const busy = acceptingId === row.id || releasingId === row.id

                return (
                  <CatalogTableRow key={row.id} className="group">
                    <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                    <CatalogTableCell className="font-mono text-xs font-semibold text-slate-900">
                      {opCode(row)}
                    </CatalogTableCell>
                    <CatalogTableCell className="max-w-[12rem] truncate">{productLabel(row)}</CatalogTableCell>
                    <CatalogTableCell className="text-sm">{shiftLabel(row)}</CatalogTableCell>
                    <CatalogTableCell className="tabular-nums font-medium">
                      {formatKgDisplay(row.quantity)}
                    </CatalogTableCell>
                    <CatalogTableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${kindClass}`}
                      >
                        {kindLabel}
                      </span>
                    </CatalogTableCell>
                    <CatalogTableCell className={`text-right ${stickyActionCellClass}`}>
                      <div className="flex flex-wrap justify-end gap-1">
                        {row.sent_to_materials ? (
                          <span className="text-xs font-medium text-emerald-700">
                            {INVENTORY_RETURN_LABELS.sentToMaterials}
                          </span>
                        ) : releaseable && row.status === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void releaseToMaterials(row.id)}
                          >
                            {releasingId === row.id
                              ? INVENTORY_RETURN_LABELS.releasingToMaterials
                              : INVENTORY_RETURN_LABELS.verifyAndRelease}
                          </Button>
                        ) : releaseable && row.status === "accepted" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void releaseToMaterials(row.id)}
                          >
                            {releasingId === row.id
                              ? INVENTORY_RETURN_LABELS.releasingToMaterials
                              : INVENTORY_RETURN_LABELS.releaseToMaterials}
                          </Button>
                        ) : row.status === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy}
                            onClick={() => void acceptReturn(row.id)}
                          >
                            {acceptingId === row.id
                              ? INVENTORY_RETURN_LABELS.accepting
                              : INVENTORY_RETURN_LABELS.accept}
                          </Button>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700">
                            {INVENTORY_RETURN_LABELS.accepted}
                          </span>
                        )}
                      </div>
                    </CatalogTableCell>
                  </CatalogTableRow>
                )
              })
            )}
          </CatalogTableBody>
        </CatalogTablePanel>

        {rows && !loading ? (
          <p className="text-xs text-slate-500">{INVENTORY_RETURN_LABELS.count(total)}</p>
        ) : null}

        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onPageChange={setPage}
          selectId="inventory-returns-per-page"
        />
      </div>
    </PageShell>
  )
}
