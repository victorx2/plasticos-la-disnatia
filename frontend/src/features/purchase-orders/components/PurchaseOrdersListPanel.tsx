import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import {
  BarChart3,
  Calendar,
  CircleDot,
  Eye,
  FileText,
  Hash,
  List,
  PackageCheck,
  PackagePlus,
  Settings2,
  ShoppingCart,
  Truck,
} from "lucide-react"

import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import { purchaseOrderStatusLabel } from "@/features/purchase-orders/status"
import type { PurchaseOrder } from "@/features/purchase-orders/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogFilterSelect } from "@/shared/catalog/CatalogFilterSelect"
import { CatalogIconTooltipButton } from "@/shared/catalog/CatalogIconTooltipButton"
import { CatalogListPanelShell, catalogTableCellClass, catalogTableRowClass } from "@/shared/catalog/CatalogListPanelShell"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
} from "@/shared/catalog/CatalogTable"
import type { PaginatedResponse } from "@/shared/types/pagination"
import { formatDateDMY } from "@/shared/format/dates"
import { Button } from "@/shared/ui/button"

type SupplierOption = { id: number; name: string }

type PurchaseOrdersListPanelProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  isHistoryTab: boolean
  rows: PaginatedResponse<PurchaseOrder> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  tabs: ReactNode
  suppliers: SupplierOption[]
  loadingSuppliers: boolean
  supplierFilter: string
  onSupplierFilterChange: (value: string) => void
  newOrderButton: ReactNode
}

export function PurchaseOrdersListPanel({
  query,
  onQueryChange,
  onSearchSubmit,
  loading,
  showInitialSkeleton,
  hasActiveFilters,
  isHistoryTab,
  rows,
  perPage,
  onPerPageChange,
  onPageChange,
  tabs,
  suppliers,
  loadingSuppliers,
  supplierFilter,
  onSupplierFilterChange,
  newOrderButton,
}: PurchaseOrdersListPanelProps) {
  const colCount = 9
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  const empty = hasActiveFilters
    ? { title: PURCHASE_ORDER_LABELS.emptyFiltered, description: PURCHASE_ORDER_LABELS.emptyFilteredDescription }
    : isHistoryTab
      ? { title: PURCHASE_ORDER_LABELS.emptyHistoryTitle, description: PURCHASE_ORDER_LABELS.emptyHistoryDescription }
      : { title: PURCHASE_ORDER_LABELS.emptyPendingTitle, description: PURCHASE_ORDER_LABELS.emptyPendingDescription }

  return (
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={PURCHASE_ORDER_LABELS.searchPlaceholder}
      searchAriaLabel={PURCHASE_ORDER_LABELS.searchLabel}
      searchId="po-search"
      hasActiveFilters={hasActiveFilters}
      tabs={tabs}
      minTableWidth="1040px"
      filters={
        <CatalogFilterSelect
          id="po-supplier-filter"
          label={PURCHASE_ORDER_LABELS.supplierFilter}
          value={supplierFilter}
          disabled={loadingSuppliers}
          options={[
            { value: "all", label: PURCHASE_ORDER_LABELS.supplierFilterAll },
            ...suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.name })),
          ]}
          onChange={onSupplierFilterChange}
        />
      }
      showPagination={showPagination}
      pagination={
        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
          selectId="purchase-orders-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {PURCHASE_ORDER_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-32">
            <CatalogTableHeadLabel icon={FileText} iconClassName="text-violet-500">
              {PURCHASE_ORDER_LABELS.fields.code}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[10rem]">
            <CatalogTableHeadLabel icon={Truck} iconClassName="text-indigo-500">
              {PURCHASE_ORDER_LABELS.fields.supplier}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={CircleDot} iconClassName="text-emerald-500">
              {PURCHASE_ORDER_LABELS.fields.status}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-36">
            <CatalogTableHeadLabel icon={BarChart3} iconClassName="text-sky-500">
              {PURCHASE_ORDER_LABELS.fields.progress}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-20">
            <CatalogTableHeadLabel icon={List} iconClassName="text-amber-500">
              {PURCHASE_ORDER_LABELS.fields.lines}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-24">
            <CatalogTableHeadLabel icon={PackageCheck} iconClassName="text-emerald-500">
              {PURCHASE_ORDER_LABELS.fields.receipts}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Calendar} iconClassName="text-amber-500">
              {PURCHASE_ORDER_LABELS.fields.orderedAt}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-36">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {PURCHASE_ORDER_LABELS.table.actions}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
        </CatalogTableHeadRow>
      </CatalogTableHeader>

      <CatalogTableBody>
        {showInitialSkeleton ? (
          <CatalogLoadingRows colSpan={colCount} />
        ) : !tableData.length ? (
          <CatalogEmptyRows colSpan={colCount}>
            <CatalogEmptyState
              compact
              icon={ShoppingCart}
              title={empty.title}
              description={empty.description}
              action={hasActiveFilters || isHistoryTab ? undefined : newOrderButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((order, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const supplierName =
              order.supplier?.name?.trim() ||
              (order.supplier_id ? `Proveedor #${order.supplier_id}` : "—")
            const viewHref = `/ordenes-compra/nueva?id=${order.id}`

            return (
              <tr key={order.id} className={catalogTableRowClass}>
                <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>{n}</td>
                <td className={catalogTableCellClass}>
                  <Link
                    to={viewHref}
                    className="font-mono text-xs font-semibold text-slate-900 hover:text-violet-700"
                  >
                    {order.code}
                  </Link>
                </td>
                <td className={catalogTableCellClass}>
                  <span className="inline-flex items-center gap-2">
                    <EntityAvatar name={supplierName} />
                    <span className="truncate text-slate-700">{supplierName}</span>
                  </span>
                </td>
                <td className={catalogTableCellClass}>
                  <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {purchaseOrderStatusLabel(order.status)}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} text-xs text-slate-600`}>
                  {order.receipt_progress_label ?? "—"}
                </td>
                <td className={`${catalogTableCellClass} tabular-nums text-slate-700`}>
                  {order.lines_count ?? "—"}
                </td>
                <td className={`${catalogTableCellClass} tabular-nums text-slate-700`}>
                  {order.receipts_count ?? 0}
                </td>
                <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                  {formatDateDMY(order.ordered_at ?? order.created_at)}
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <div className="flex justify-end gap-0.5">
                    {!isHistoryTab ? (
                      <Button type="button" size="sm" className="h-8 gap-1 px-2.5" asChild>
                        <Link to={`/recepciones/nueva?oc=${order.id}`}>
                          <PackagePlus className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                          Recibir
                        </Link>
                      </Button>
                    ) : null}
                    <CatalogIconTooltipButton
                      label={PURCHASE_ORDER_LABELS.table.view}
                      icon={Eye}
                      href={viewHref}
                    />
                  </div>
                </td>
              </tr>
            )
          })
        )}
      </CatalogTableBody>
    </CatalogListPanelShell>
  )
}
