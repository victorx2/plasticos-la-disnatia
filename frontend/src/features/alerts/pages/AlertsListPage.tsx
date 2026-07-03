import { useNavigate } from "react-router-dom"
import { BadgeCheck, RefreshCw } from "lucide-react"

import { AlertRowActions } from "@/features/alerts/components/AlertRowActions"
import { ALERT_LABELS, alertSeverityClass, alertSeverityLabel } from "@/features/alerts/labels"
import { useAlertsList } from "@/features/alerts/hooks/useAlertsList"
import { catalogRowNumber } from "@/shared/catalog/classes"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { catalogFilterPanelClass } from "@/shared/catalog/classes"
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
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString("es-VE", { dateStyle: "short", timeStyle: "short" })
}

export function AlertsListPage() {
  const navigate = useNavigate()
  const {
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    showInitialSkeleton,
    unreadOnly,
    setUnreadOnly,
    unreadTotal,
    markOneRead,
    markAllRead,
    syncAndReload,
    markingId,
    markingAll,
    syncing,
  } = useAlertsList()

  const total = rows?.total ?? 0

  return (
    <PageShell
      title={ALERT_LABELS.listTitle}
      subtitle={ALERT_LABELS.listSubtitle}
      icon={BadgeCheck}
      action={
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={syncing || loading}
            onClick={() => void syncAndReload()}
          >
            <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden />
            {ALERT_LABELS.refresh}
          </Button>
          {unreadTotal > 0 ? (
            <Button type="button" variant="outline" disabled={markingAll} onClick={() => void markAllRead()}>
              {ALERT_LABELS.markAllRead}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {unreadTotal > 0 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {ALERT_LABELS.unreadBanner(unreadTotal)} — pendientes de atención del equipo.
          </p>
        ) : null}

        <div className={catalogFilterPanelClass}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xs">
              <Label htmlFor="alerts-visibility">{ALERT_LABELS.filters.visibility}</Label>
              <select
                id="alerts-visibility"
                className="mt-2 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={unreadOnly ? "unread" : "all"}
                onChange={(e) => setUnreadOnly(e.target.value === "unread")}
              >
                <option value="unread">{ALERT_LABELS.filters.unreadOnly}</option>
                <option value="all">{ALERT_LABELS.filters.all}</option>
              </select>
            </div>
            {rows && !loading ? (
              <p className="text-xs font-medium text-slate-600">{ALERT_LABELS.count(total)}</p>
            ) : null}
          </div>
        </div>

        <CatalogTablePanel minWidth="920px">
          <CatalogTableHeader>
            <CatalogTableHeadRow>
              <CatalogTableHead className="w-16">{ALERT_LABELS.table.number}</CatalogTableHead>
              <CatalogTableHead className="w-36">{ALERT_LABELS.table.updated}</CatalogTableHead>
              <CatalogTableHead className="min-w-[12rem]">{ALERT_LABELS.table.title}</CatalogTableHead>
              <CatalogTableHead>{ALERT_LABELS.table.detail}</CatalogTableHead>
              <CatalogTableHead className="w-28">{ALERT_LABELS.table.status}</CatalogTableHead>
              <CatalogTableHead align="right" className="w-44">
                {ALERT_LABELS.table.actions}
              </CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>

          <CatalogTableBody>
            {showInitialSkeleton ? (
              <CatalogLoadingRows colSpan={6} />
            ) : !rows?.data.length ? (
              <CatalogEmptyRows colSpan={6}>
                <CatalogEmptyState
                  compact
                  icon={BadgeCheck}
                  title={unreadOnly ? ALERT_LABELS.emptyUnreadTitle : ALERT_LABELS.emptyTitle}
                  description={
                    unreadOnly ? ALERT_LABELS.emptyUnreadDescription : ALERT_LABELS.emptyDescription
                  }
                />
              </CatalogEmptyRows>
            ) : (
              rows.data.map((row, index) => {
                const n = catalogRowNumber(rows.current_page, rows.per_page, index)
                return (
                  <CatalogTableRow
                    key={row.id}
                    className={cn(
                      row.href_path && "cursor-pointer hover:bg-slate-50/80",
                      !row.is_read && "bg-violet-50/30",
                    )}
                    onClick={() => {
                      if (row.href_path) navigate(row.href_path)
                    }}
                  >
                    <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
                    <CatalogTableCell className="text-xs text-slate-600">
                      {formatDateTime(row.updated_at ?? row.created_at)}
                    </CatalogTableCell>
                    <CatalogTableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{row.title}</p>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                            alertSeverityClass(row.severity),
                          )}
                        >
                          {alertSeverityLabel(row.severity)}
                        </span>
                      </div>
                    </CatalogTableCell>
                    <CatalogTableCell className="max-w-[24rem] text-sm leading-relaxed text-slate-600">
                      {row.body}
                    </CatalogTableCell>
                    <CatalogTableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          row.is_read
                            ? "bg-slate-100 text-slate-600"
                            : "bg-violet-50 text-violet-700",
                        )}
                      >
                        {row.is_read ? ALERT_LABELS.status.read : ALERT_LABELS.status.unread}
                      </span>
                    </CatalogTableCell>
                    <CatalogTableCell className="text-right">
                      <AlertRowActions
                        alert={row}
                        marking={markingId === row.id}
                        onMarkRead={(id) => void markOneRead(id)}
                      />
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
          selectId="alerts-per-page"
        />
      </div>
    </PageShell>
  )
}
