import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Factory, PackageOpen, PackagePlus, ScrollText } from "lucide-react"
import { toast } from "sonner"

import { fetchDashboardSummary } from "@/features/dashboard/api"
import {
  fetchExtrusionDailySummary,
  fetchExtrusionRuns,
} from "@/features/production/extrusion/api"
import { buildExtrusionLineBoard } from "@/features/production/extrusion/lib/build-line-board"
import { EXTRUSION_LABELS, extrusionMachineLabel } from "@/features/production/extrusion/labels"
import type { ExtrusionDailySummary, ExtrusionRunListItem } from "@/features/production/extrusion/types"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { ProductionSectionPanel } from "@/features/production/shared/ProductionSectionPanel"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import {
  catalogTableCellClass,
  catalogTableRowClass,
} from "@/shared/catalog/CatalogListPanelShell"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
} from "@/shared/catalog/CatalogTable"
import { PageShell } from "@/shared/catalog/PageShell"
import { downloadCsv } from "@/shared/export/csv"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import { ApiError } from "@/shared/api/client"

function currentMonthLabel(): string {
  return new Date().toLocaleDateString("es-VE", { month: "long", year: "numeric" })
}

function dashKg(value: number): string {
  return value > 0 ? formatKgDisplay(value) : "—"
}

function dashCount(value: number): string {
  return value > 0 ? String(value) : "—"
}

export function ExtrusionPage() {
  const [loading, setLoading] = useState(true)
  const [monthKg, setMonthKg] = useState("0")
  const [dailySummary, setDailySummary] = useState<ExtrusionDailySummary[]>([])
  const [todayRuns, setTodayRuns] = useState<ExtrusionRunListItem[]>([])

  const monthLabel = useMemo(() => currentMonthLabel(), [])
  const lineBoard = useMemo(() => buildExtrusionLineBoard(dailySummary), [dailySummary])
  const hasLineActivity = lineBoard.some((row) => row.totalKg > 0 || row.runsCount > 0)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [summary, daily, runs] = await Promise.all([
          fetchDashboardSummary(),
          fetchExtrusionDailySummary(),
          fetchExtrusionRuns({ per_page: 10, page: 1 }),
        ])
        if (!cancelled) {
          setMonthKg(summary.extrusion_month_kg ?? "0")
          setDailySummary(daily)
          setTodayRuns(runs.data)
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof ApiError ? error.message : EXTRUSION_LABELS.loadError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const hasDailyData = hasLineActivity || todayRuns.length > 0
  const registerButton = (
    <Button type="button" asChild>
      <Link to="/extrusion/registro">{EXTRUSION_LABELS.registerProduction}</Link>
    </Button>
  )

  return (
    <PageShell
      title={EXTRUSION_LABELS.title}
      subtitle={EXTRUSION_LABELS.subtitle}
      icon={Factory}
      meta={
        !loading && hasDailyData ? (
          <CatalogCountBadge
            label={`${lineBoard.filter((r) => r.runsCount > 0).length} línea${lineBoard.filter((r) => r.runsCount > 0).length === 1 ? "" : "s"} activas hoy`}
          />
        ) : null
      }
      action={registerButton}
    >
      <div className="space-y-6">
        <ProductionFlowStrip activeStep="extrusion" />

        <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">{EXTRUSION_LABELS.monthProduction}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {loading ? (
              <span className="inline-block h-9 w-24 animate-pulse rounded bg-emerald-100/80" />
            ) : (
              formatKgDisplay(monthKg)
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">{EXTRUSION_LABELS.monthHint(monthLabel)}</p>
        </div>

        <ProductionSectionPanel title={EXTRUSION_LABELS.dailyTitle} minHeight="320px">
          <table className="w-full text-left text-sm" style={{ minWidth: "720px" }}>
            <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
              <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
                <CatalogTableHead>{EXTRUSION_LABELS.dailyLineColumn}</CatalogTableHead>
                <CatalogTableHead>{EXTRUSION_LABELS.dailyShiftColumn}</CatalogTableHead>
                <CatalogTableHead>Kg</CatalogTableHead>
                <CatalogTableHead>{EXTRUSION_LABELS.dailyCoilsColumn}</CatalogTableHead>
                <CatalogTableHead>{EXTRUSION_LABELS.dailyWasteColumn}</CatalogTableHead>
                <CatalogTableHead>{EXTRUSION_LABELS.dailyCoreColumn}</CatalogTableHead>
                <CatalogTableHead>Tramos</CatalogTableHead>
              </CatalogTableHeadRow>
            </CatalogTableHeader>
            <CatalogTableBody>
              {loading ? (
                <CatalogLoadingRows colSpan={7} />
              ) : (
                lineBoard.map((row) => (
                  <tr key={row.line} className={catalogTableRowClass}>
                    <td className={`${catalogTableCellClass} font-medium text-slate-900`}>
                      {extrusionMachineLabel(row.line)}
                    </td>
                    <td className={`${catalogTableCellClass} text-slate-600`}>{row.shifts}</td>
                    <td className={`${catalogTableCellClass} tabular-nums font-semibold text-slate-900`}>
                      {dashKg(row.totalKg)}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                      {dashCount(row.coilsCount)}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                      {dashKg(row.wasteKg)}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                      {dashKg(row.coreKg)}
                    </td>
                    <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                      {dashCount(row.runsCount)}
                    </td>
                  </tr>
                ))
              )}
            </CatalogTableBody>
          </table>
          {!loading && !hasLineActivity ? (
            <div className="mt-4">
              <CatalogEmptyState
                compact
                icon={Factory}
                title={EXTRUSION_LABELS.dailyEmpty}
                action={registerButton}
              />
            </div>
          ) : null}
        </ProductionSectionPanel>

        {!loading && hasLineActivity ? (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  "extrusion-cuadro-lineas",
                  ["Línea", "Turno(s)", "Kg", "Bobinas", "Kg desperdicio", "Kg core", "Tramos"],
                  lineBoard.map((row) => [
                    extrusionMachineLabel(row.line),
                    row.shifts,
                    row.totalKg,
                    row.coilsCount,
                    row.wasteKg,
                    row.coreKg,
                    row.runsCount,
                  ]),
                )
              }
            >
              {EXTRUSION_LABELS.exportCsv}
            </Button>
          </div>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{EXTRUSION_LABELS.actionsTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/extrusion/registro"
              className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 shadow-sm transition hover:border-violet-300 sm:col-span-2"
            >
              <div className="flex items-center gap-2 text-violet-700">
                <Factory className="h-4 w-4" aria-hidden />
                <span className="font-medium">{EXTRUSION_LABELS.registerProduction}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                {EXTRUSION_LABELS.registerProductionHint}
              </p>
            </Link>

            <Link
              to="/solicitudes-material/nueva"
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-300"
            >
              <div className="flex items-center gap-2 text-violet-700">
                <PackagePlus className="h-4 w-4" aria-hidden />
                <span className="font-medium">{EXTRUSION_LABELS.actions.request}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{EXTRUSION_LABELS.actions.requestHint}</p>
            </Link>

            <Link
              to="/devoluciones/nueva"
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-300"
            >
              <div className="flex items-center gap-2 text-violet-700">
                <PackageOpen className="h-4 w-4" aria-hidden />
                <span className="font-medium">{EXTRUSION_LABELS.actions.return}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{EXTRUSION_LABELS.actions.returnHint}</p>
            </Link>

            <Link
              to="/movimientos-inventario"
              className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-300 sm:col-span-2"
            >
              <div className="flex items-center gap-2 text-violet-700">
                <ScrollText className="h-4 w-4" aria-hidden />
                <span className="font-medium">{EXTRUSION_LABELS.actions.movements}</span>
              </div>
              <p className="mt-2 text-xs text-slate-600">{EXTRUSION_LABELS.actions.movementsHint}</p>
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
