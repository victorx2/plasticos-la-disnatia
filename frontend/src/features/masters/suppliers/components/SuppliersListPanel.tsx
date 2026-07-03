import { Link } from "react-router-dom"
import type { ReactNode } from "react"
import {
  Calendar,
  CircleDot,
  Hash,
  IdCard,
  Mail,
  MapPin,
  Phone,
  Settings2,
  Truck,
  User,
} from "lucide-react"

import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import type { Supplier } from "@/features/masters/suppliers/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEditButton } from "@/shared/catalog/CatalogEditButton"
import { CatalogStatusToggleButton } from "@/shared/catalog/CatalogStatusToggleButton"
import { CatalogListPanelShell, catalogTableCellClass, catalogTableRowClass } from "@/shared/catalog/CatalogListPanelShell"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import { formatPhoneDisplay, truncateText } from "@/shared/catalog/entityDisplay"
import { RifBadge } from "@/shared/catalog/RifBadge"
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

type SuppliersListPanelProps = {
  inventoryView: boolean
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  isInactiveTab: boolean
  rows: PaginatedResponse<Supplier> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  newSupplierButton: ReactNode
  togglingId: number | null
  onToggleActive: (supplier: Supplier) => void
}

export function SuppliersListPanel({
  inventoryView,
  query,
  onQueryChange,
  onSearchSubmit,
  loading,
  showInitialSkeleton,
  hasActiveFilters,
  isInactiveTab,
  rows,
  perPage,
  onPerPageChange,
  onPageChange,
  newSupplierButton,
  togglingId,
  onToggleActive,
}: SuppliersListPanelProps) {
  const colCount = inventoryView ? 6 : 9
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  return (
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={SUPPLIER_LABELS.searchPlaceholder}
      searchAriaLabel={SUPPLIER_LABELS.searchLabel}
      searchId="supplier-search"
      hasActiveFilters={hasActiveFilters}
      minTableWidth={inventoryView ? "720px" : "960px"}
      showPagination={showPagination}
      pagination={
        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
          selectId="suppliers-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {SUPPLIER_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[12rem]">
            <CatalogTableHeadLabel icon={User} iconClassName="text-violet-500">
              {SUPPLIER_LABELS.fields.name}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-40">
            <CatalogTableHeadLabel icon={IdCard} iconClassName="text-amber-500">
              {SUPPLIER_LABELS.fields.rif}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          {!inventoryView ? (
            <>
              <CatalogTableHead className="min-w-[11rem]">
                <CatalogTableHeadLabel icon={Mail} iconClassName="text-sky-500">
                  {SUPPLIER_LABELS.fields.email}
                </CatalogTableHeadLabel>
              </CatalogTableHead>
              <CatalogTableHead className="w-36">
                <CatalogTableHeadLabel icon={Phone} iconClassName="text-sky-500">
                  {SUPPLIER_LABELS.fields.phone}
                </CatalogTableHeadLabel>
              </CatalogTableHead>
              <CatalogTableHead className="min-w-[10rem]">
                <CatalogTableHeadLabel icon={MapPin} iconClassName="text-emerald-500">
                  {SUPPLIER_LABELS.fields.address}
                </CatalogTableHeadLabel>
              </CatalogTableHead>
            </>
          ) : null}
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={CircleDot} iconClassName="text-emerald-500">
              Estado
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Calendar} iconClassName="text-amber-500">
              {SUPPLIER_LABELS.fields.created}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-24">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {SUPPLIER_LABELS.table.actions}
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
              icon={Truck}
              title={
                hasActiveFilters
                  ? SUPPLIER_LABELS.emptyFiltered
                  : isInactiveTab
                    ? SUPPLIER_LABELS.emptyInactiveTitle
                    : SUPPLIER_LABELS.emptyTitle
              }
              description={
                hasActiveFilters
                  ? SUPPLIER_LABELS.emptyFilteredDescription
                  : isInactiveTab
                    ? SUPPLIER_LABELS.emptyInactiveDescription
                    : SUPPLIER_LABELS.emptyDescription
              }
              action={hasActiveFilters || isInactiveTab ? undefined : newSupplierButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((supplier, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const editHref = `/proveedores/form?id=${supplier.id}`
            const email = supplier.email?.trim()
            const phone = formatPhoneDisplay(supplier.phone)

            return (
              <tr key={supplier.id} className={catalogTableRowClass}>
                <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>{n}</td>
                <td className={catalogTableCellClass}>
                  <Link
                    to={editHref}
                    className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    <EntityAvatar name={supplier.name} photoUrl={supplier.photo_url} />
                    <span className="truncate font-medium text-slate-900 group-hover:text-violet-700">
                      {supplier.name}
                    </span>
                  </Link>
                </td>
                <td className={catalogTableCellClass}>
                  <RifBadge rif={supplier.rif} />
                </td>
                {!inventoryView ? (
                  <>
                    <td className={`${catalogTableCellClass} max-w-[14rem]`}>
                      {email ? (
                        <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 truncate text-violet-700 hover:underline">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
                          {email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={catalogTableCellClass}>
                      {phone !== "—" ? (
                        <a href={`tel:${phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-slate-700 hover:text-violet-700">
                          <Phone className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                          {phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`${catalogTableCellClass} max-w-[14rem]`} title={supplier.address ?? undefined}>
                      <span className="inline-flex items-start gap-1.5 text-slate-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                        <span className="min-w-0 leading-snug">{truncateText(supplier.address, 56)}</span>
                      </span>
                    </td>
                  </>
                ) : null}
                <td className={catalogTableCellClass}>
                  <span
                    className={
                      supplier.active
                        ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : "inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    }
                  >
                    {supplier.active ? SUPPLIER_LABELS.status.active : SUPPLIER_LABELS.status.inactive}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                  {formatDateDMY(supplier.created_at)}
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <div className="flex justify-end gap-0.5">
                    <CatalogEditButton to={editHref} label={SUPPLIER_LABELS.table.edit} />
                    <CatalogStatusToggleButton
                      active={supplier.active}
                      activateLabel={SUPPLIER_LABELS.actions.activate}
                      deactivateLabel={SUPPLIER_LABELS.actions.deactivate}
                      disabled={togglingId === supplier.id}
                      onToggle={() => void onToggleActive(supplier)}
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
