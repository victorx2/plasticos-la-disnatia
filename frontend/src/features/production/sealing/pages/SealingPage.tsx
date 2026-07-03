import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Package, Scissors } from "lucide-react"
import { toast } from "sonner"

import { fetchSealingRuns } from "@/features/production/sealing/api"
import { SEALING_LABELS, sealingShiftLabel } from "@/features/production/sealing/labels"
import type { SealingRunRead } from "@/features/production/sealing/types"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import {
  CatalogListPanelShell,
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

export function SealingPage() {
  const [loading, setLoading] = useState(true)
  const [runs, setRuns] = useState<SealingRunRead[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const response = await fetchSealingRuns({ page: 1, per_page: 20 })
        if (!cancelled) setRuns(response.data)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof ApiError ? error.message : SEALING_LABELS.loadError
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

  function exportRuns() {
    downloadCsv(
      "sellado-registros",
      ["ID", "Trabajo", "Turno", "Unidades", "Desperdicio kg", "Fecha"],
      runs.map((run) => [
        run.id,
        run.work_order_code ?? run.work_order_id,
        sealingShiftLabel(run.shift),
        run.total_units,
        run.waste_kg,
        new Date(run.recorded_at).toLocaleString("es-VE"),
      ]),
    )
  }

  const registerButton = (
    <Button type="button" asChild>
      <Link to="/sellado/registro">{SEALING_LABELS.register}</Link>
    </Button>
  )

  return (
    <PageShell
      title={SEALING_LABELS.title}
      subtitle={SEALING_LABELS.subtitle}
      icon={Scissors}
      meta={!loading ? <CatalogCountBadge label={SEALING_LABELS.count(runs.length)} /> : null}
      action={
        <div className="flex flex-wrap gap-2">
          {runs.length > 0 ? (
            <Button type="button" variant="outline" onClick={exportRuns}>
              {SEALING_LABELS.exportCsv}
            </Button>
          ) : null}
          {registerButton}
        </div>
      }
    >
      <div className="space-y-4">
        <ProductionFlowStrip activeStep="sellado" />

        <CatalogListPanelShell
          query=""
          onQueryChange={() => undefined}
          onSearchSubmit={() => undefined}
          searchPlaceholder=""
          searchAriaLabel=""
          searchId="sealing-search"
          showSearch={false}
          minTableWidth="760px"
        >
          <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
            <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
              <CatalogTableHead>Trabajo</CatalogTableHead>
              <CatalogTableHead>Turno</CatalogTableHead>
              <CatalogTableHead>Unidades</CatalogTableHead>
              <CatalogTableHead>Desperdicio</CatalogTableHead>
              <CatalogTableHead>Fecha</CatalogTableHead>
            </CatalogTableHeadRow>
          </CatalogTableHeader>
          <CatalogTableBody>
            {loading ? (
              <CatalogLoadingRows colSpan={5} />
            ) : runs.length === 0 ? (
              <CatalogEmptyRows colSpan={5}>
                <CatalogEmptyState
                  compact
                  icon={Scissors}
                  title={SEALING_LABELS.recentEmpty}
                  action={registerButton}
                />
              </CatalogEmptyRows>
            ) : (
              runs.map((run) => (
                <tr key={run.id} className={catalogTableRowClass}>
                  <td className={`${catalogTableCellClass} font-mono text-xs font-semibold text-slate-900`}>
                    {run.work_order_code ?? run.work_order_id}
                  </td>
                  <td className={catalogTableCellClass}>
                    <span className="inline-flex rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {sealingShiftLabel(run.shift)}
                    </span>
                  </td>
                  <td className={`${catalogTableCellClass} tabular-nums text-slate-700`}>
                    {run.total_units} uds
                  </td>
                  <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                    {formatKgDisplay(run.waste_kg)}
                  </td>
                  <td className={`${catalogTableCellClass} whitespace-nowrap text-slate-600`}>
                    {new Date(run.recorded_at).toLocaleString("es-VE")}
                  </td>
                </tr>
              ))
            )}
          </CatalogTableBody>
        </CatalogListPanelShell>

        <Link
          to="/sellado/registro"
          className="flex items-center gap-2 rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 text-sm text-violet-800 shadow-sm transition hover:border-violet-300"
        >
          <Package className="h-4 w-4" aria-hidden />
          {SEALING_LABELS.register}
        </Link>
      </div>
    </PageShell>
  )
}
