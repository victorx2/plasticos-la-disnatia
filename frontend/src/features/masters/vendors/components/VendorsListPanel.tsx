import { Link } from "react-router-dom"
import { useState, type ReactNode } from "react"
import {
  Calendar,
  CircleDot,
  Hash,
  Phone,
  PhoneForwarded,
  Settings2,
  User,
  Users,
} from "lucide-react"

import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import type { Vendor } from "@/features/masters/vendors/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogConfirmDialog } from "@/shared/catalog/CatalogConfirmDialog"
import { CatalogEditButton } from "@/shared/catalog/CatalogEditButton"
import { CatalogPhoneCell } from "@/shared/catalog/CatalogPhoneCell"
import { CatalogStatusToggleButton } from "@/shared/catalog/CatalogStatusToggleButton"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import { CatalogListPanelShell, catalogTableCellClass, catalogTableRowClass } from "@/shared/catalog/CatalogListPanelShell"
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
import { cn } from "@/shared/lib/utils"

type VendorsListPanelProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  isInactiveTab: boolean
  rows: PaginatedResponse<Vendor> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  togglingId: number | null
  onToggleActive: (vendor: Vendor) => Promise<void>
  newVendorButton: ReactNode
}

export function VendorsListPanel({
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
  togglingId,
  onToggleActive,
  newVendorButton,
}: VendorsListPanelProps) {
  const [pendingDeactivate, setPendingDeactivate] = useState<Vendor | null>(null)
  const colCount = 8
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  const empty = hasActiveFilters
    ? { title: VENDOR_LABELS.emptyFiltered, description: VENDOR_LABELS.emptyFilteredDescription }
    : isInactiveTab
      ? { title: VENDOR_LABELS.emptyInactiveTitle, description: VENDOR_LABELS.emptyInactiveDescription }
      : { title: VENDOR_LABELS.emptyTitle, description: VENDOR_LABELS.emptyDescription }

  return (
    <>
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={VENDOR_LABELS.searchPlaceholder}
      searchAriaLabel={VENDOR_LABELS.searchLabel}
      searchId="vendor-search"
      hasActiveFilters={hasActiveFilters}
      minTableWidth="920px"
      showPagination={showPagination}
      pagination={
        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
          selectId="vendors-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {VENDOR_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[12rem]">
            <CatalogTableHeadLabel icon={User} iconClassName="text-violet-500">
              {VENDOR_LABELS.fields.name}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-36">
            <CatalogTableHeadLabel icon={Phone} iconClassName="text-sky-500">
              {VENDOR_LABELS.fields.phonePrimary}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-36">
            <CatalogTableHeadLabel icon={PhoneForwarded} iconClassName="text-indigo-400">
              {VENDOR_LABELS.fields.phoneSecondary}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={CircleDot} iconClassName="text-emerald-500">
              {VENDOR_LABELS.fields.status}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-20">
            <CatalogTableHeadLabel icon={Users} iconClassName="text-indigo-500">
              {VENDOR_LABELS.table.clients}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-28">
            <CatalogTableHeadLabel icon={Calendar} iconClassName="text-amber-500">
              {VENDOR_LABELS.fields.created}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-24">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {VENDOR_LABELS.table.actions}
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
              icon={Users}
              title={empty.title}
              description={empty.description}
              action={hasActiveFilters || isInactiveTab ? undefined : newVendorButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((vendor, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const editHref = `/vendedores/form?id=${vendor.id}`
            const clientsCount = vendor.clients_count ?? 0

            return (
              <tr key={vendor.id} className={catalogTableRowClass}>
                <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>{n}</td>
                <td className={catalogTableCellClass}>
                  <Link
                    to={editHref}
                    className="flex min-w-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    <EntityAvatar name={vendor.name} photoUrl={vendor.photo_url} />
                    <span className="truncate font-medium text-slate-900 group-hover:text-violet-700">
                      {vendor.name}
                    </span>
                  </Link>
                </td>
                <td className={`${catalogTableCellClass} max-w-[9rem]`}>
                  <CatalogPhoneCell phone={vendor.phone_primary} />
                </td>
                <td className={`${catalogTableCellClass} max-w-[9rem]`}>
                  <CatalogPhoneCell phone={vendor.phone_secondary} />
                </td>
                <td className={catalogTableCellClass}>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                      vendor.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {vendor.active ? VENDOR_LABELS.status.active : VENDOR_LABELS.status.inactive}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} tabular-nums text-slate-700`}>
                  {clientsCount > 0 ? (
                    <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {clientsCount}
                    </span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                  {formatDateDMY(vendor.created_at)}
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <div className="flex justify-end gap-0.5">
                    <CatalogEditButton to={editHref} label={VENDOR_LABELS.table.edit} />
                    <CatalogStatusToggleButton
                      active={vendor.active}
                      activateLabel={VENDOR_LABELS.actions.activate}
                      deactivateLabel={VENDOR_LABELS.actions.deactivate}
                      disabled={togglingId === vendor.id}
                      onToggle={() => {
                        if (vendor.active) {
                          setPendingDeactivate(vendor)
                        } else {
                          void onToggleActive(vendor)
                        }
                      }}
                    />
                  </div>
                </td>
              </tr>
            )
          })
        )}
      </CatalogTableBody>
    </CatalogListPanelShell>

    <CatalogConfirmDialog
      open={pendingDeactivate != null}
      title={VENDOR_LABELS.confirmDeactivateTitle}
      description={
        pendingDeactivate
          ? (pendingDeactivate.clients_count ?? 0) > 0
            ? VENDOR_LABELS.confirmDeactivateWithClients(
                pendingDeactivate.name,
                pendingDeactivate.clients_count ?? 0,
              )
            : VENDOR_LABELS.confirmDeactivateNoClients(pendingDeactivate.name)
          : null
      }
      confirmLabel={VENDOR_LABELS.confirmDeactivateAction}
      cancelLabel={VENDOR_LABELS.confirmCancel}
      loading={pendingDeactivate != null && togglingId === pendingDeactivate.id}
      variant="danger"
      onCancel={() => setPendingDeactivate(null)}
      onConfirm={() => {
        if (!pendingDeactivate) return
        void onToggleActive(pendingDeactivate).then(() => setPendingDeactivate(null))
      }}
    />
  </>
  )
}
