import { ScrollText } from "lucide-react"

import { inventoryAreaLabel } from "@/features/materials/areas"
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_OPTIONS,
  REFERENCE_TYPE_LABELS,
  REFERENCE_TYPE_OPTIONS,
} from "@/features/inventory-movements/enums"
import { INVENTORY_MOVEMENT_LABELS } from "@/features/inventory-movements/labels"
import { useInventoryMovementsList } from "@/features/inventory-movements/hooks/useInventoryMovementsList"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CatalogSearchPanel } from "@/shared/catalog/CatalogSearchPanel"
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
import { formatDateDMY } from "@/shared/format/dates"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

function formatQty(value: string | number | null | undefined): string {
  const n = Number(String(value ?? "0").replace(",", "."))
  if (!Number.isFinite(n)) return "0.000"
  return n.toFixed(3)
}

export function InventoryMovementsListPage() {
  const {
    query,
    setQuery,
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    applySearchNow,
    hasActiveFilters,
    showInitialSkeleton,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    movementType,
    setMovementType,
    inventoryArea,
    setInventoryArea,
    referenceType,
    setReferenceType,
    areaOptions,
  } = useInventoryMovementsList()

  const total = rows?.total ?? 0

  return (
    <PageShell
      title={INVENTORY_MOVEMENT_LABELS.listTitle}
      subtitle={INVENTORY_MOVEMENT_LABELS.listSubtitle}
      icon={ScrollText}
    >
      <div className="space-y-4">
        <CatalogSearchPanel
          id="movement-search"
          label={INVENTORY_MOVEMENT_LABELS.searchLabel}
          placeholder={INVENTORY_MOVEMENT_LABELS.searchPlaceholder}
          value={query}
          onChange={setQuery}
          onSubmit={applySearchNow}
          countLabel={rows && !loading ? INVENTORY_MOVEMENT_LABELS.count(total) : null}
          footer={
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <div>
                <Label htmlFor="mov-from">{INVENTORY_MOVEMENT_LABELS.filters.from}</Label>
                <Input
                  id="mov-from"
                  type="date"
                  className="mt-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mov-to">{INVENTORY_MOVEMENT_LABELS.filters.to}</Label>
                <Input
                  id="mov-to"
                  type="date"
                  className="mt-2"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mov-type">{INVENTORY_MOVEMENT_LABELS.filters.movementType}</Label>
                <select
                  id="mov-type"
                  className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                >
                  {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="mov-area">{INVENTORY_MOVEMENT_LABELS.filters.inventoryArea}</Label>
                <select
                  id="mov-area"
                  className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={inventoryArea}
                  onChange={(e) => setInventoryArea(e.target.value)}
                >
                  {areaOptions.map((opt) => (
                    <option key={opt.id || "all"} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="mov-ref">{INVENTORY_MOVEMENT_LABELS.filters.referenceType}</Label>
                <select
                  id="mov-ref"
                  className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={referenceType}
                  onChange={(e) => setReferenceType(e.target.value)}
                >
                  {REFERENCE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        />

        <CatalogTablePanel minWidth="1040px">
          <CatalogTableHeader>
            <CatalogTableHeadRow>
              <CatalogTableHead className="w-16">
                {INVENTORY_MOVEMENT_LABELS.table.number}
              </CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.date}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.type}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.material}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.area}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.quantity}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.user}</CatalogTableHead>
              <CatalogTableHead>{INVENTORY_MOVEMENT_LABELS.fields.reference}</CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>

          <CatalogTableBody>
            {showInitialSkeleton ? (
              <CatalogLoadingRows colSpan={8} />
            ) : !rows?.data.length ? (
              <CatalogEmptyRows colSpan={8}>
                <CatalogEmptyState
                  compact
                  icon={ScrollText}
                  title={INVENTORY_MOVEMENT_LABELS.emptyTitle}
                  description={INVENTORY_MOVEMENT_LABELS.emptyDescription}
                />
              </CatalogEmptyRows>
            ) : (
              rows.data.map((movement, index) => {
                const n = catalogRowNumber(rows.current_page, rows.per_page, index)
                const refLabel = movement.reference_type
                  ? `${REFERENCE_TYPE_LABELS[movement.reference_type] ?? movement.reference_type}${
                      movement.reference_id ? ` #${movement.reference_id}` : ""
                    }`
                  : "—"

                return (
                  <CatalogTableRow key={movement.id}>
                    <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                    <CatalogTableCell className="whitespace-nowrap">
                      {formatDateDMY(movement.occurred_at)}
                    </CatalogTableCell>
                    <CatalogTableCell>
                      <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        {MOVEMENT_TYPE_LABELS[movement.movement_type] ?? movement.movement_type}
                      </span>
                    </CatalogTableCell>
                    <CatalogTableCell className="max-w-[14rem] truncate">
                      {movement.material
                        ? `${movement.material.sku} · ${movement.material.name}`
                        : `Material #${movement.material_id}`}
                    </CatalogTableCell>
                    <CatalogTableCell className="text-xs">
                      {movement.material?.inventory_area
                        ? inventoryAreaLabel(movement.material.inventory_area)
                        : "—"}
                    </CatalogTableCell>
                    <CatalogTableCell className="tabular-nums font-medium">
                      {formatQty(movement.quantity)} {movement.material?.unit ?? ""}
                    </CatalogTableCell>
                    <CatalogTableCell className="text-sm">
                      {movement.user?.name ?? "—"}
                    </CatalogTableCell>
                    <CatalogTableCell className="text-xs text-slate-600">{refLabel}</CatalogTableCell>
                  </CatalogTableRow>
                )
              })
            )}
          </CatalogTableBody>
        </CatalogTablePanel>

        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onPageChange={setPage}
          selectId="inventory-movements-per-page"
        />
      </div>
    </PageShell>
  )
}
