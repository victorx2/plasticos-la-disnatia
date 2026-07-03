import { Link } from "react-router-dom"
import { ClipboardList, Plus } from "lucide-react"

import {
  areaLabel,
  areaRequestStatusLabel,
  AREA_OPTIONS,
  STATUS_OPTIONS,
} from "@/features/area-requests/areas"
import { AREA_REQUEST_LABELS } from "@/features/area-requests/labels"
import { useAreaRequestsList } from "@/features/area-requests/hooks/useAreaRequestsList"
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
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"

export function AreaRequestsListPage() {
  const {
    query,
    setQuery,
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    applySearchNow,
    showInitialSkeleton,
    areaFilter,
    setAreaFilter,
    statusFilter,
    setStatusFilter,
    pendingCount,
  } = useAreaRequestsList()

  const total = rows?.total ?? 0

  const newRequestButton = (
    <Button type="button" asChild>
      <Link to="/solicitudes-material/nueva">
        <Plus className="h-4 w-4" aria-hidden />
        {AREA_REQUEST_LABELS.newRequest}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={AREA_REQUEST_LABELS.listTitle}
      subtitle={AREA_REQUEST_LABELS.listSubtitle}
      icon={ClipboardList}
      action={newRequestButton}
    >
      <div className="space-y-4">
        {pendingCount && pendingCount.count > 0 ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {AREA_REQUEST_LABELS.pendingBadge(pendingCount.count)} en bandeja de almacén.
          </p>
        ) : null}

        <CatalogSearchPanel
          id="area-request-search"
          label="Buscar"
          placeholder="Título de solicitud…"
          value={query}
          onChange={setQuery}
          onSubmit={applySearchNow}
          countLabel={rows && !loading ? AREA_REQUEST_LABELS.count(total) : null}
          footer={
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="ar-area">{AREA_REQUEST_LABELS.filters.area}</Label>
                <select
                  id="ar-area"
                  className="mt-2 h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                >
                  <option value="">Todas</option>
                  {AREA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="ar-status">{AREA_REQUEST_LABELS.filters.status}</Label>
                <select
                  id="ar-status"
                  className="mt-2 h-9 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value || "all"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          }
        />

        <CatalogTablePanel minWidth="820px">

          <CatalogTableHeader>
            <CatalogTableHeadRow>
              <CatalogTableHead className="w-16">{AREA_REQUEST_LABELS.table.number}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.table.requestNumber}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.table.productionOrder}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.fields.area}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.fields.title}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.fields.requester}</CatalogTableHead>
              <CatalogTableHead>{AREA_REQUEST_LABELS.fields.status}</CatalogTableHead>
              <CatalogTableHead align="right">{AREA_REQUEST_LABELS.table.actions}</CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>

          <CatalogTableBody>
  {showInitialSkeleton ? (
    /* 🌟 Cambiado colSpan de 7 a 8 */
    <CatalogLoadingRows colSpan={8} />
  ) : !rows?.data.length ? (
    /* 🌟 Cambiado colSpan de 7 a 8 */
    <CatalogEmptyRows colSpan={8}>
      <CatalogEmptyState
        compact
        icon={ClipboardList}
        title={AREA_REQUEST_LABELS.emptyTitle}
        description={AREA_REQUEST_LABELS.emptyDescription}
        action={newRequestButton}
      />
    </CatalogEmptyRows>
  ) : (
    rows.data.map((row, index) => {
      const n = catalogRowNumber(rows.current_page, rows.per_page, index)
      return (
        <CatalogTableRow key={row.id}>
          <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                  <CatalogTableCell className="font-mono text-xs font-medium">#{row.material_request_id}</CatalogTableCell>
                  <CatalogTableCell className="font-mono text-xs font-semibold text-violet-800">
                    {row.production_order_number ?? "—"}
                  </CatalogTableCell>
          <CatalogTableCell>{areaLabel(row.area)}</CatalogTableCell>
          <CatalogTableCell className="max-w-[16rem] truncate font-medium">
            {row.title ?? "—"}
          </CatalogTableCell>
          <CatalogTableCell>{row.requester?.name ?? "—"}</CatalogTableCell>
          <CatalogTableCell>
            <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
              {areaRequestStatusLabel(row.status)}
            </span>
          </CatalogTableCell>
          <CatalogTableCell className="text-right">
            <Button type="button" variant="default" size="sm" asChild>
              <Link to={`/solicitudes-area/insumos/${row.material_request_id}`}>
                {AREA_REQUEST_LABELS.viewInsumos}
              </Link>
            </Button>
          </CatalogTableCell>
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
          selectId="area-requests-per-page"
        />
      </div>
    </PageShell>
  )
}
