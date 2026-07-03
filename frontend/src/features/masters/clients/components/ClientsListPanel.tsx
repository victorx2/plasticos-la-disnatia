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
  User,
  Users,
} from "lucide-react"

import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import { formatLocation, formatPhoneDisplay } from "@/features/masters/clients/display"
import type { Client } from "@/features/masters/clients/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEditButton } from "@/shared/catalog/CatalogEditButton"
import { CatalogStatusToggleButton } from "@/shared/catalog/CatalogStatusToggleButton"
import { CatalogListPanelShell } from "@/shared/catalog/CatalogListPanelShell"
import { CatalogTableHeadLabel } from "@/shared/catalog/CatalogTableHeadLabel"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
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
import { catalogTableCellClass, catalogTableRowClass } from "@/shared/catalog/CatalogListPanelShell"

type ClientsListPanelProps = {
  inventoryView: boolean
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  loading: boolean
  showInitialSkeleton: boolean
  hasActiveFilters: boolean
  isInactiveTab: boolean
  rows: PaginatedResponse<Client> | null
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  searchPlaceholder: string
  newClientButton: ReactNode
  togglingId: number | null
  onToggleActive: (client: Client) => Promise<void>
}

export function ClientsListPanel({
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
  searchPlaceholder,
  newClientButton,
  togglingId,
  onToggleActive,
}: ClientsListPanelProps) {
  const colCount = inventoryView ? 6 : 10
  const tableData = rows?.data ?? []
  const showPagination = !showInitialSkeleton && tableData.length > 0

  return (
    <CatalogListPanelShell
      query={query}
      onQueryChange={onQueryChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={searchPlaceholder}
      searchAriaLabel={CLIENT_LABELS.searchLabel}
      searchId="client-search"
      hasActiveFilters={hasActiveFilters}
      minTableWidth="980px"
      showPagination={showPagination}
      pagination={
        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={onPerPageChange}
          onPageChange={onPageChange}
          selectId="clients-per-page"
        />
      }
    >
      <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
        <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
          <CatalogTableHead className="w-12">
            <CatalogTableHeadLabel icon={Hash} iconClassName="text-slate-500">
              {CLIENT_LABELS.table.number}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="min-w-[12rem]">
            <CatalogTableHeadLabel icon={User} iconClassName="text-violet-500">
              {CLIENT_LABELS.fields.name}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead className="w-40">
            <CatalogTableHeadLabel icon={IdCard} iconClassName="text-amber-500">
              {CLIENT_LABELS.fields.rif}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          {!inventoryView ? (
            <>
              <CatalogTableHead className="min-w-[10rem]">
                <CatalogTableHeadLabel icon={MapPin} iconClassName="text-emerald-500">
                  Estado / Ciudad
                </CatalogTableHeadLabel>
              </CatalogTableHead>
              <CatalogTableHead className="min-w-[11rem]">
                <CatalogTableHeadLabel icon={Mail} iconClassName="text-sky-500">
                  {CLIENT_LABELS.fields.email}
                </CatalogTableHeadLabel>
              </CatalogTableHead>
              <CatalogTableHead className="w-36">
                <CatalogTableHeadLabel icon={Phone} iconClassName="text-sky-500">
                  {CLIENT_LABELS.fields.phone}
                </CatalogTableHeadLabel>
              </CatalogTableHead>
              <CatalogTableHead className="min-w-[9rem]">
                <CatalogTableHeadLabel icon={Users} iconClassName="text-violet-500">
                  {CLIENT_LABELS.fields.vendor}
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
              {CLIENT_LABELS.fields.created}
            </CatalogTableHeadLabel>
          </CatalogTableHead>
          <CatalogTableHead align="right" className="w-24">
            <CatalogTableHeadLabel icon={Settings2} iconClassName="text-slate-500">
              {CLIENT_LABELS.table.actions}
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
              title={
                hasActiveFilters
                  ? CLIENT_LABELS.emptyFiltered
                  : isInactiveTab
                    ? "Sin clientes desactivados"
                    : CLIENT_LABELS.emptyTitle
              }
              description={
                hasActiveFilters
                  ? CLIENT_LABELS.emptyFilteredDescription
                  : isInactiveTab
                    ? "Los clientes desactivados aparecerán aquí."
                    : CLIENT_LABELS.emptyDescription
              }
              action={hasActiveFilters || isInactiveTab ? undefined : newClientButton}
            />
          </CatalogEmptyRows>
        ) : (
          tableData.map((client, index) => {
            const n = catalogRowNumber(rows!.current_page, rows!.per_page, index)
            const email = client.email?.trim()
            const phone = formatPhoneDisplay(client.phone)
            const editHref = `/clientes/form?id=${client.id}`

            return (
              <tr key={client.id} className={catalogTableRowClass}>
                <td className={`${catalogTableCellClass} tabular-nums text-xs text-slate-400`}>{n}</td>
                <td className={catalogTableCellClass}>
                  <Link
                    to={editHref}
                    className="flex min-w-0 items-center gap-3 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  >
                    <EntityAvatar name={client.name} photoUrl={client.photo_url} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900 group-hover:text-violet-700">
                        {client.name}
                      </span>
                      {!inventoryView && email ? (
                        <span className="mt-0.5 block truncate text-xs text-slate-500 sm:hidden">
                          {email}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </td>
                <td className={catalogTableCellClass}>
                  <RifBadge rif={client.rif} />
                </td>
                {!inventoryView ? (
                  <>
                    <td className={catalogTableCellClass}>
                      <span className="inline-flex max-w-[14rem] items-start gap-1.5 text-slate-700">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
                        <span className="min-w-0 leading-snug">
                          {formatLocation(client.state, client.city)}
                        </span>
                      </span>
                    </td>
                    <td className={`${catalogTableCellClass} max-w-[14rem]`}>
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="block truncate text-violet-700 hover:text-violet-900 hover:underline"
                        >
                          {email}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`${catalogTableCellClass} whitespace-nowrap`}>
                      {phone !== "—" ? (
                        <a
                          href={`tel:${phone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-violet-700"
                        >
                          <Phone className="h-3.5 w-3.5 text-sky-500" aria-hidden />
                          {phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className={`${catalogTableCellClass} max-w-[12rem]`}>
                      {client.vendor_name?.trim() ? (
                        <span
                          className="inline-flex max-w-full truncate rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
                          title={client.vendor_name}
                        >
                          {client.vendor_name}
                        </span>
                      ) : (
                        <span className="text-slate-400">{CLIENT_LABELS.vendorNone}</span>
                      )}
                    </td>
                  </>
                ) : null}
                <td className={catalogTableCellClass}>
                  <span
                    className={
                      client.active
                        ? "inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : "inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                    }
                  >
                    {client.active ? CLIENT_LABELS.status.active : CLIENT_LABELS.status.inactive}
                  </span>
                </td>
                <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                  {formatDateDMY(client.created_at)}
                </td>
                <td className={`${catalogTableCellClass} text-right`}>
                  <div className="flex justify-end gap-0.5">
                    <CatalogEditButton to={editHref} label={CLIENT_LABELS.table.edit} />
                    <CatalogStatusToggleButton
                      active={client.active}
                      activateLabel={CLIENT_LABELS.actions.activate}
                      deactivateLabel={CLIENT_LABELS.actions.deactivate}
                      disabled={togglingId === client.id}
                      onToggle={() => void onToggleActive(client)}
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
