import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import { Calendar, Hash, Layers, Package, Settings2, Users } from "lucide-react"

import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import type { Product } from "@/features/masters/products/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEditButton } from "@/shared/catalog/CatalogEditButton"
import { CatalogFilterSelect } from "@/shared/catalog/CatalogFilterSelect"
import { CatalogListPanelShell, catalogTableCellClass, catalogTableRowClass } from "@/shared/catalog/CatalogListPanelShell"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import { truncateText } from "@/shared/catalog/entityDisplay"
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

type ClientOption = { id: number; name: string }

type ProductsListPanelProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  rows: PaginatedResponse<Product> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  clients: ClientOption[]
  loadingClients: boolean
  clientFilter: string
  onClientFilterChange: (value: string) => void
  newProductButton: ReactNode
}

export function ProductsListPanel({
  query,
  onQueryChange,
  onSearchSubmit,
  loading,
  showInitialSkeleton,
  hasActiveFilters,
  rows,
  perPage,
  onPerPageChange,
  onPageChange,
  clients,
  loadingClients,
  clientFilter,
  onClientFilterChange,
  newProductButton,
}: ProductsListPanelProps) {
  const colCount = 6
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  return (
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={PRODUCT_LABELS.searchPlaceholder}
      searchAriaLabel={PRODUCT_LABELS.searchLabel}
      searchId="product-search"
      hasActiveFilters={hasActiveFilters}
      minTableWidth="980px"
      filters={
        <CatalogFilterSelect
          id="product-client-filter"
          label={PRODUCT_LABELS.clientFilter}
          value={clientFilter}
          disabled={loadingClients}
          options={[
            { value: "all", label: PRODUCT_LABELS.clientFilterAll },
            ...clients.map((client) => ({ value: String(client.id), label: client.name })),
          ]}
          onChange={onClientFilterChange}
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
          selectId="products-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {PRODUCT_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[11rem]">
            <CatalogTableHeadLabel icon={Package} iconClassName="text-violet-500">
              {PRODUCT_LABELS.fields.name}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[9rem]">
            <CatalogTableHeadLabel icon={Users} iconClassName="text-indigo-500">
              {PRODUCT_LABELS.fields.client}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[14rem]">
            <CatalogTableHeadLabel icon={Layers} iconClassName="text-emerald-500">
              {PRODUCT_LABELS.fields.structure}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Calendar} iconClassName="text-amber-500">
              {PRODUCT_LABELS.fields.created}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-24">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {PRODUCT_LABELS.table.actions}
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
              icon={Package}
              title={hasActiveFilters ? PRODUCT_LABELS.emptyFiltered : PRODUCT_LABELS.emptyTitle}
              description={
                hasActiveFilters
                  ? PRODUCT_LABELS.emptyFilteredDescription
                  : PRODUCT_LABELS.emptyDescription
              }
              action={hasActiveFilters ? undefined : newProductButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((product, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const editHref = `/productos/form?id=${product.id}`
            const clientName =
              product.client?.name?.trim() ||
              (product.client_id ? `Cliente #${product.client_id}` : "—")

            return (
              <tr key={product.id} className={catalogTableRowClass}>
                <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>{n}</td>
                <td className={catalogTableCellClass}>
                  <Link
                    to={editHref}
                    className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    <EntityAvatar name={product.name} />
                    <span className="truncate font-medium text-slate-900 group-hover:text-violet-700">
                      {product.name}
                    </span>
                  </Link>
                </td>
                <td className={catalogTableCellClass}>
                  <span className="inline-flex rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {clientName}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} max-w-[18rem]`} title={product.structure ?? undefined}>
                  {truncateText(product.structure, 56)}
                </td>
                <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                  {formatDateDMY(product.created_at)}
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <CatalogEditButton to={editHref} label={PRODUCT_LABELS.table.edit} />
                </td>
              </tr>
            )
          })
        )}
      </CatalogTableBody>
    </CatalogListPanelShell>
  )
}
