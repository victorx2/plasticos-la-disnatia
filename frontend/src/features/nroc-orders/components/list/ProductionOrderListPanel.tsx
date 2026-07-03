import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import {
  ClipboardList,
  Factory,
  Hash,
  Layers,
  Package,
  Scale,
  Settings2,
  Users,
} from "lucide-react"

import { ProductionOrderPlantCell } from "@/features/nroc-orders/components/list/cells/ProductionOrderPlantCell"
import { ProductionOrderStatusBadge } from "@/features/nroc-orders/components/list/cells/ProductionOrderStatusBadge"
import {
  formatProductionOrderProduct,
  formatProductionOrderQuantity,
} from "@/features/nroc-orders/lib/format-production-order-rows"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrder } from "@/features/nroc-orders/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEditButton } from "@/shared/catalog/CatalogEditButton"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import {
  CatalogListPanelShell,
  catalogTableCellClass,
  catalogTableRowClass,
} from "@/shared/catalog/CatalogListPanelShell"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
} from "@/shared/catalog/CatalogTable"
import type { PaginatedResponse } from "@/shared/types/pagination"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

type ProductionOrderListPanelProps = {
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  rows: PaginatedResponse<NrocOrder> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  tabs: ReactNode
  newOrderButton: ReactNode
  highlightBatchCode?: string | null
  onViewHistory?: (orderId: number, orderCode: string) => void
}

export function ProductionOrderListPanel({
  loading,
  showInitialSkeleton,
  hasActiveFilters,
  rows,
  perPage,
  onPerPageChange,
  onPageChange,
  query,
  onQueryChange,
  onSearchSubmit,
  tabs,
  newOrderButton,
  highlightBatchCode,
  onViewHistory,
}: ProductionOrderListPanelProps) {
  const colCount = 9
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  return (
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={PRODUCTION_ORDER_LABELS.searchPlaceholder}
      searchAriaLabel={PRODUCTION_ORDER_LABELS.searchAriaLabel}
      searchId="nroc-search"
      hasActiveFilters={hasActiveFilters}
      tabs={tabs}
      minTableWidth="1040px"
      showPagination={showPagination}
      pagination={
        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
          selectId="nroc-orders-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {PRODUCTION_ORDER_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-32">
            <CatalogTableHeadLabel icon={ClipboardList} iconClassName="text-violet-500">
              {PRODUCTION_ORDER_LABELS.columns.code}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Layers} iconClassName="text-indigo-500">
              {PRODUCTION_ORDER_LABELS.columns.batchCode}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[10rem]">
            <CatalogTableHeadLabel icon={Users} iconClassName="text-indigo-500">
              {PRODUCTION_ORDER_LABELS.columns.client}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[12rem]">
            <CatalogTableHeadLabel icon={Package} iconClassName="text-violet-500">
              {PRODUCTION_ORDER_LABELS.columns.product}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Scale} iconClassName="text-emerald-500">
              {PRODUCTION_ORDER_LABELS.columns.quantity}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={ClipboardList} iconClassName="text-amber-500">
              {PRODUCTION_ORDER_LABELS.columns.status}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[10rem]">
            <CatalogTableHeadLabel icon={Factory} iconClassName="text-sky-500">
              {PRODUCTION_ORDER_LABELS.columns.plant}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-24">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {PRODUCTION_ORDER_LABELS.table.actions}
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
              icon={ClipboardList}
              title={hasActiveFilters ? PRODUCTION_ORDER_LABELS.emptyFiltered : PRODUCTION_ORDER_LABELS.emptyTitle}
              description={
                hasActiveFilters
                  ? PRODUCTION_ORDER_LABELS.emptyFilteredHint
                  : PRODUCTION_ORDER_LABELS.emptyDescription
              }
              action={hasActiveFilters ? undefined : newOrderButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((order, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const clientName =
              order.client?.name?.trim() ||
              (order.client_id ? `Cliente #${order.client_id}` : "—")
            const viewHref = `/orden-produccion/nueva?id=${order.id}`

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
                <td
                  className={cn(
                    `${catalogTableCellClass} font-mono text-xs`,
                    highlightBatchCode
                      ? "bg-violet-50/80 font-semibold text-violet-800"
                      : "text-slate-600",
                  )}
                >
                  {order.batch_code ?? order.code}
                  {order.batch_id ? (
                    <Link
                      to={`/orden-produccion/nueva?batch_id=${order.batch_id}`}
                      className="ml-2 text-violet-700 hover:underline"
                    >
                      +
                    </Link>
                  ) : null}
                </td>
                <td className={catalogTableCellClass}>
                  <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {clientName}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} text-slate-700`}>
                  {formatProductionOrderProduct(order)}
                </td>
                <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                  {formatProductionOrderQuantity(order)}
                </td>
                <td className={catalogTableCellClass}>
                  <ProductionOrderStatusBadge status={order.status} />
                </td>
                <td className={catalogTableCellClass}>
                  <ProductionOrderPlantCell order={order} />
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    {onViewHistory ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-violet-700"
                        onClick={() => onViewHistory(order.id, order.code)}
                      >
                        {PRODUCTION_ORDER_LABELS.table.history}
                      </Button>
                    ) : null}
                    <CatalogEditButton to={viewHref} label={PRODUCTION_ORDER_LABELS.table.edit} />
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
