import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart3, Clock, Factory, FlaskConical, Layers, Recycle, ScrollText } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import {
  fetchMixtureConsumptionByOrder,
  fetchMixtureConsumptionTotal,
  fetchProductionGeneral,
  fetchProductionTimes,
  fetchProductionByMachine,
  fetchWasteByOrder,
  fetchWasteConsolidated,
} from "@/features/reports/api"
import { ReportBrandBar } from "@/features/reports/components/ReportBrandBar"
import { SubproductDispatchBanner } from "@/features/production-subproducts/components/SubproductDispatchBanner"
import { ReportEmptyState, ReportLoadError, ReportPanelShell } from "@/features/reports/components/ReportPanelShell"
import { ReportTypeNav } from "@/features/reports/components/ReportTypeNav"
import { REPORTS_LABELS, type ReportTabId } from "@/features/reports/labels"
import { reportPathForTab, reportTabFromSlug, isValidReportSlug } from "@/features/reports/routes"
import { accentDataSurface, accentKpi } from "@/features/reports/reportTheme"
import type {
  MixtureConsumptionByOrderRow,
  MixtureConsumptionRow,
  ProductionGeneralRow,
  ProductionMachineReportRow,
  ProductionTimeRow,
  WasteByOrderRow,
  WasteConsolidatedRow,
} from "@/features/reports/types"
import {
  catalogTableCellClass,
  catalogTableRowClass,
} from "@/shared/catalog/CatalogListPanelShell"
import { PageShell } from "@/shared/catalog/PageShell"
import { ApiError } from "@/shared/api/client"
import { downloadTableExport } from "@/shared/export/exportTable"
import type { ExportFormat, TableExportPayload } from "@/shared/export/types"
import { formatDurationMinutes, formatKgDisplay, parseMinutesNumber } from "@/shared/format/numbers"
import { cn } from "@/shared/lib/utils"

import "@/shared/catalog/CatalogDataTable.css"

function isOrderCompleted(row: MixtureConsumptionByOrderRow): boolean {
  if (row.order_target_kg == null || row.order_target_kg === "") return false
  return Number(row.kg_remaining ?? 0) <= 0.001
}

function productionTimeMinutes(row: ProductionTimeRow): number {
  const fromMinutes = parseMinutesNumber(row.effective_minutes)
  if (fromMinutes > 0) return fromMinutes
  return parseMinutesNumber(row.effective_hours) * 60
}

const TAB_ICONS = {
  times: Clock,
  total: FlaskConical,
  byOrder: ScrollText,
  production: Factory,
  waste: Recycle,
  machine: Layers,
} as const

const tableHeadClass =
  "catalog-table-head sticky top-0 z-10 bg-white/95 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur-sm"

export function ReportsHubPage() {
  const navigate = useNavigate()
  const { reportTab: reportTabSlug } = useParams<{ reportTab: string }>()
  const tab = reportTabFromSlug(reportTabSlug)
  const setTab = useCallback(
    (nextTab: ReportTabId) => {
      navigate(reportPathForTab(nextTab))
    },
    [navigate],
  )

  useEffect(() => {
    if (!isValidReportSlug(reportTabSlug)) {
      navigate(reportPathForTab("times"), { replace: true })
    }
  }, [navigate, reportTabSlug])

  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [completedOrdersOnly, setCompletedOrdersOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [times, setTimes] = useState<ProductionTimeRow[]>([])
  const [totalRows, setTotalRows] = useState<MixtureConsumptionRow[]>([])
  const [byOrder, setByOrder] = useState<MixtureConsumptionByOrderRow[]>([])
  const [productionRows, setProductionRows] = useState<ProductionGeneralRow[]>([])
  const [wasteRows, setWasteRows] = useState<WasteByOrderRow[]>([])
  const [wasteTotal, setWasteTotal] = useState<WasteConsolidatedRow | null>(null)
  const [machineRows, setMachineRows] = useState<ProductionMachineReportRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const query = { from_date: fromDate || undefined, to_date: toDate || undefined }
      if (tab === "times") {
        setTimes(await fetchProductionTimes(query))
      } else if (tab === "total") {
        setTotalRows(await fetchMixtureConsumptionTotal(query))
      } else if (tab === "byOrder") {
        setByOrder(await fetchMixtureConsumptionByOrder())
      } else if (tab === "production") {
        setProductionRows(await fetchProductionGeneral(query))
      } else if (tab === "machine") {
        setMachineRows(await fetchProductionByMachine(query))
      } else {
        const [rows, consolidated] = await Promise.all([
          fetchWasteByOrder(query),
          fetchWasteConsolidated(query),
        ])
        setWasteRows(rows)
        setWasteTotal(consolidated)
      }
    } catch (error) {
      setLoadFailed(true)
      const message = error instanceof ApiError ? error.message : REPORTS_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [tab, fromDate, toDate])

  useEffect(() => {
    void load()
  }, [load])

  function buildExportPayload(): TableExportPayload | null {
    const title = REPORTS_LABELS.tabs[tab].title

    if (tab === "times") {
      if (!times.length) return null
      return {
        slug: "tiempos",
        title,
        headers: [
          REPORTS_LABELS.columns.work,
          REPORTS_LABELS.columns.client,
          REPORTS_LABELS.columns.effective,
          REPORTS_LABELS.columns.segments,
          REPORTS_LABELS.columns.dead,
          REPORTS_LABELS.columns.utilization,
        ],
        rows: times.map((row) => [
          row.work_order_code,
          row.client_name ?? "",
          formatDurationMinutes(productionTimeMinutes(row)),
          String(row.segment_count ?? 0),
          row.dead_hours ?? "",
          row.utilization_pct ?? "",
        ]),
      }
    }

    if (tab === "total") {
      if (!totalRows.length) return null
      return {
        slug: "consumo-total",
        title,
        headers: [REPORTS_LABELS.columns.sku, REPORTS_LABELS.columns.name, REPORTS_LABELS.columns.totalKg],
        rows: totalRows.map((row) => [row.output_sku, row.output_name, row.total_kg]),
      }
    }

    if (tab === "byOrder") {
      if (!byOrder.length) return null
      return {
        slug: "consumo-por-orden",
        title,
        headers: [
          REPORTS_LABELS.columns.order,
          REPORTS_LABELS.columns.client,
          REPORTS_LABELS.columns.product,
          REPORTS_LABELS.columns.orderTarget,
          REPORTS_LABELS.columns.produced,
          REPORTS_LABELS.columns.kgRemaining,
          REPORTS_LABELS.columns.mixtureUsed,
          REPORTS_LABELS.columns.sku,
          REPORTS_LABELS.columns.name,
          REPORTS_LABELS.columns.totalKg,
          REPORTS_LABELS.columns.materialSku,
          REPORTS_LABELS.columns.materialName,
          REPORTS_LABELS.columns.materialKg,
        ],
        rows: byOrder.flatMap((row) => {
          const recipeRows =
            row.mixture_recipe?.map((material) => [
              row.client_order_code,
              row.client_name ?? "",
              row.product_name ?? "",
              row.order_target_kg ?? "",
              row.total_produced_kg,
              row.kg_remaining ?? "",
              row.total_mixture_used_kg ?? "0",
              "",
              REPORTS_LABELS.columns.mixtureRecipeTitle,
              "",
              material.material_sku,
              material.material_name,
              material.total_kg,
            ]) ?? []

          const mixtureRows = row.mixture_totals.length
            ? row.mixture_totals.flatMap((mix) => {
              const base = [
                row.client_order_code,
                row.client_name ?? "",
                row.product_name ?? "",
                row.order_target_kg ?? "",
                row.total_produced_kg,
                row.kg_remaining ?? "",
                row.total_mixture_used_kg ?? "0",
                mix.output_sku,
                mix.output_name,
                mix.total_kg,
              ]
              if (mix.components?.length) {
                return mix.components.map((material) => [
                  ...base,
                  material.material_sku,
                  material.material_name,
                  material.total_kg,
                ])
              }
              return [[...base, "", "", ""]]
            })
            : [[
              row.client_order_code,
              row.client_name ?? "",
              row.product_name ?? "",
              row.order_target_kg ?? "",
              row.total_produced_kg,
              row.kg_remaining ?? "",
              row.total_mixture_used_kg ?? "0",
              "",
              "",
              "",
              "",
              "",
              "",
            ]]

          return [...recipeRows, ...mixtureRows]
        }),
      }
    }

    if (tab === "production") {
      if (!productionRows.length) return null
      return {
        slug: "produccion-general",
        title,
        headers: [
          REPORTS_LABELS.columns.work,
          REPORTS_LABELS.columns.order,
          REPORTS_LABELS.columns.client,
          REPORTS_LABELS.columns.coils,
          REPORTS_LABELS.columns.totalKg,
          REPORTS_LABELS.columns.bolsones,
        ],
        rows: productionRows.map((row) => [
          row.work_order_code,
          row.client_order_code ?? "",
          row.client_name ?? "",
          row.total_coils,
          row.total_kg,
          row.total_bolsones_kg,
        ]),
      }
    }

    if (!wasteRows.length) return null
    return {
      slug: "desperdicio",
      title,
      headers: [
        REPORTS_LABELS.columns.order,
        REPORTS_LABELS.columns.work,
        REPORTS_LABELS.columns.refil,
        REPORTS_LABELS.columns.transparente,
        REPORTS_LABELS.columns.wasteTotal,
      ],
      rows: wasteRows.map((row) => [
        row.client_order_code ?? "",
        row.work_order_code,
        row.refil_kg,
        row.transparente_kg,
        row.total_kg,
      ]),
      summary: wasteTotal
        ? [
          { label: REPORTS_LABELS.columns.refil, value: wasteTotal.refil_kg },
          { label: REPORTS_LABELS.columns.transparente, value: wasteTotal.transparente_kg },
          { label: REPORTS_LABELS.wasteConsolidated, value: wasteTotal.total_kg },
        ]
        : undefined,
    }
  }

  function exportCurrentTab(format: ExportFormat) {
    const payload = buildExportPayload()
    if (!payload) return
    downloadTableExport(format, payload)
  }

  const displayedByOrder = useMemo(
    () => (completedOrdersOnly ? byOrder.filter(isOrderCompleted) : byOrder),
    [byOrder, completedOrdersOnly],
  )
  const completedOrderCount = useMemo(() => byOrder.filter(isOrderCompleted).length, [byOrder])

  const recordCount =
    tab === "times"
      ? times.length
      : tab === "total"
        ? totalRows.length
        : tab === "byOrder"
          ? displayedByOrder.length
          : tab === "production"
            ? productionRows.length
            : wasteRows.length

  const canExport = !loading && recordCount > 0
  const EmptyIcon = TAB_ICONS[tab]

  return (
    <PageShell title={REPORTS_LABELS.title} subtitle={REPORTS_LABELS.subtitle} icon={BarChart3}>
      <div className="space-y-6">
        <ReportBrandBar />
        <p className="text-xs text-slate-500">{REPORTS_LABELS.periodHint}</p>

        <ReportTypeNav value={tab} onChange={setTab} />

        <ReportPanelShell
          tab={tab}
          recordCount={loading ? null : recordCount}
          showDateFilters={tab !== "byOrder"}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          onApply={() => void load()}
          onExport={exportCurrentTab}
          canExport={canExport}
          loading={loading}
        >
          {loading ? (
            <p className="py-10 text-center text-sm text-slate-500">{REPORTS_LABELS.loading}</p>
          ) : loadFailed ? (
            <ReportLoadError onRetry={() => void load()} />
          ) : tab === "times" ? (
            times.length === 0 ? (
              <ReportEmptyState tab="times" icon={EmptyIcon} />
            ) : (
              <div className={cn("catalog-data-table overflow-x-auto", accentDataSurface.violet)}>
                <table className="w-full min-w-[720px] text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.work}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.client}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.effective}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.segments}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.dead}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.utilization}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {times.map((row) => (
                      <tr key={row.work_order_id} className={catalogTableRowClass}>
                        <td className={`${catalogTableCellClass} font-mono text-xs font-semibold`}>
                          {row.work_order_code}
                        </td>
                        <td className={catalogTableCellClass}>{row.client_name ?? "—"}</td>
                        <td className={`${catalogTableCellClass} tabular-nums`}>
                          <span className="font-semibold text-violet-900">
                            {formatDurationMinutes(productionTimeMinutes(row))}
                          </span>
                          <p className="mt-0.5 text-xs font-normal text-slate-500">
                            {REPORTS_LABELS.columns.effectiveHint}
                          </p>
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums`}>
                          {row.segment_count ?? 0}
                        </td>
                        <td className={`${catalogTableCellClass} tabular-nums text-slate-500`}>
                          {row.dead_hours ?? "—"}
                        </td>
                        <td className={catalogTableCellClass}>{row.utilization_pct ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === "total" ? (
            totalRows.length === 0 ? (
              <ReportEmptyState tab="total" icon={EmptyIcon} />
            ) : (
              <div className="space-y-4">
                <div className={cn("rounded-lg border px-4 py-3", accentKpi.emerald)}>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">
                    Total mezclas distintas
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-900">
                    {totalRows.length}
                  </p>
                </div>
                <div className={cn("catalog-data-table overflow-x-auto", accentDataSurface.emerald)}>
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className={tableHeadClass}>
                      <tr>
                        <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.sku}</th>
                        <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.name}</th>
                        <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.totalKg}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {totalRows.map((row) => (
                        <tr key={row.output_sku} className={catalogTableRowClass}>
                          <td className={`${catalogTableCellClass} font-mono text-xs font-semibold`}>
                            {row.output_sku}
                          </td>
                          <td className={catalogTableCellClass}>{row.output_name}</td>
                          <td className={`${catalogTableCellClass} text-right tabular-nums font-medium`}>
                            {formatKgDisplay(row.total_kg)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : tab === "byOrder" ? (
            byOrder.length === 0 ? (
              <ReportEmptyState tab="byOrder" icon={EmptyIcon} />
            ) : displayedByOrder.length === 0 ? (
              <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50/50 px-4 py-8 text-center text-sm text-amber-900">
                {REPORTS_LABELS.columns.completedOrdersHint}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/70 bg-amber-50/40 px-4 py-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-amber-700 focus:ring-amber-500"
                      checked={completedOrdersOnly}
                      onChange={(e) => setCompletedOrdersOnly(e.target.checked)}
                    />
                    {REPORTS_LABELS.columns.completedOrdersOnly}
                  </label>
                  <span className="text-xs font-medium text-emerald-800">
                    {REPORTS_LABELS.columns.completedOrdersCount(completedOrderCount)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{REPORTS_LABELS.columns.completedOrdersHint}</p>
                <div className="grid gap-4 md:grid-cols-2">
                {displayedByOrder.map((row) => (
                  <article
                    key={row.client_order_code}
                    className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/40 to-white p-4 shadow-sm"
                  >
                    <header className="border-b border-amber-100 pb-3">
                      <p className="font-mono text-sm font-bold text-slate-900">{row.client_order_code}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{row.client_name ?? "—"}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {REPORTS_LABELS.columns.product}:{" "}
                        <span className="font-medium text-slate-700">{row.product_name ?? "—"}</span>
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-amber-900">
                        {REPORTS_LABELS.columns.produced}: {formatKgDisplay(row.total_produced_kg)}
                      </p>
                      {row.order_target_kg != null && row.order_target_kg !== "" ? (
                        <>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-800">
                            {REPORTS_LABELS.columns.orderTarget}:{" "}
                            {formatKgDisplay(row.order_target_kg)}
                          </p>
                          <p
                            className={cn(
                              "mt-1 text-sm font-bold tabular-nums",
                              Number(row.kg_remaining ?? 0) <= 0.001
                                ? "text-emerald-800"
                                : "text-orange-800",
                            )}
                          >
                            {Number(row.kg_remaining ?? 0) <= 0.001
                              ? REPORTS_LABELS.columns.orderCompleted
                              : `${REPORTS_LABELS.columns.kgRemaining}: ${formatKgDisplay(row.kg_remaining ?? "0")}`}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {REPORTS_LABELS.columns.kgRemainingHint}
                          </p>
                        </>
                      ) : null}
                      {Number(row.total_mixture_used_kg ?? 0) > 0.001 ? (
                        <>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-violet-900">
                            {REPORTS_LABELS.columns.mixtureUsed}:{" "}
                            {formatKgDisplay(row.total_mixture_used_kg ?? "0")}
                          </p>
                          <p className="mt-0.5 text-xs text-violet-700">
                            {REPORTS_LABELS.columns.mixtureUsedHint}
                          </p>
                        </>
                      ) : null}
                      {Number(row.mixture_received_cross_kg ?? 0) > 0.001 ? (
                        <p className="mt-1 text-xs font-medium text-sky-800">
                          {REPORTS_LABELS.columns.mixtureCrossIn(
                            formatKgDisplay(row.mixture_received_cross_kg ?? "0"),
                          )}
                        </p>
                      ) : null}
                      {Number(row.mixture_sent_cross_kg ?? 0) > 0.001 ? (
                        <p className="mt-1 text-xs font-medium text-rose-800">
                          {REPORTS_LABELS.columns.mixtureCrossOut(
                            formatKgDisplay(row.mixture_sent_cross_kg ?? "0"),
                          )}
                        </p>
                      ) : null}
                      {Number(row.produced_kg_pending_close ?? 0) > 0.001 ? (
                        <p className="mt-1 text-xs font-medium text-amber-700">
                          {REPORTS_LABELS.columns.pendingClose(
                            formatKgDisplay(row.produced_kg_pending_close ?? "0"),
                          )}
                        </p>
                      ) : null}
                    </header>
                    {row.order_lines && row.order_lines.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-amber-100 bg-white/70 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                          {REPORTS_LABELS.columns.orderLines}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {row.order_lines.map((line) => (
                            <li
                              key={`${row.client_order_code}-${line.line_id ?? line.work_order_code ?? line.product_name}`}
                              className="flex flex-wrap items-baseline justify-between gap-2 text-sm"
                            >
                              <span className="text-slate-700">
                                {line.work_order_code ? (
                                  <span className="font-mono text-xs text-violet-700">{line.work_order_code}</span>
                                ) : null}
                                {line.work_order_code && line.product_name ? (
                                  <span className="mx-1 text-slate-300">·</span>
                                ) : null}
                                {line.product_name ?? "—"}
                              </span>
                              <span className="shrink-0 tabular-nums font-medium text-slate-800">
                                {line.target_kg != null && line.target_kg !== ""
                                  ? formatKgDisplay(line.target_kg)
                                  : `${line.quantity} ${line.unit ?? ""}`.trim()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {row.mixture_recipe && row.mixture_recipe.length > 0 ? (
                      <div className="mt-3 rounded-lg border border-violet-200/80 bg-violet-50/40 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">
                          {REPORTS_LABELS.columns.mixtureRecipeTitle}
                        </p>
                        <p className="mt-0.5 text-xs text-violet-800">
                          {REPORTS_LABELS.columns.mixtureRecipeHint}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {row.mixture_recipe.map((material) => (
                            <li
                              key={`${row.client_order_code}-recipe-${material.material_sku}`}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span className="text-slate-700">
                                <span className="font-mono text-xs text-slate-600">{material.material_sku}</span>
                                <span className="mx-1 text-slate-300">·</span>
                                {material.material_name}
                              </span>
                              <span className="shrink-0 tabular-nums font-medium text-violet-900">
                                {formatKgDisplay(material.total_kg)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <ul className="mt-3 space-y-2">
                      {row.mixture_totals.length ? (
                        row.mixture_totals.map((mix) => (
                          <li
                            key={mix.output_sku}
                            className="rounded-lg bg-white/80 px-3 py-2 text-sm ring-1 ring-amber-100"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                <span className="font-mono text-xs text-slate-600">{mix.output_sku}</span>
                                <span className="mx-1 text-slate-300">·</span>
                                {mix.output_name}
                              </span>
                              <span className="shrink-0 tabular-nums font-medium text-slate-800">
                                {formatKgDisplay(mix.total_kg)}
                              </span>
                            </div>
                            {mix.components && mix.components.length > 0 ? (
                              <div className="mt-2 border-t border-amber-100 pt-2">
                                <p className="text-xs font-medium text-slate-600">
                                  {REPORTS_LABELS.columns.mixtureComponentsTitle}
                                </p>
                                <ul className="mt-1.5 space-y-1">
                                  {mix.components.map((material) => (
                                    <li
                                      key={`${mix.output_sku}-${material.material_sku}`}
                                      className="flex items-center justify-between gap-2 text-xs text-slate-700"
                                    >
                                      <span className="truncate">
                                        <span className="font-mono text-[11px] text-slate-500">
                                          {material.material_sku}
                                        </span>
                                        <span className="mx-1 text-slate-300">·</span>
                                        {material.material_name}
                                      </span>
                                      <span className="shrink-0 tabular-nums font-semibold text-slate-800">
                                        {formatKgDisplay(material.total_kg)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-slate-500">
                          {Number(row.total_mixture_used_kg ?? 0) > 0.001
                            ? "Sin submezclas desglosadas"
                            : "Sin mezcla utilizada registrada"}
                        </li>
                      )}
                    </ul>
                  </article>
                ))}
              </div>
              </div>
            )
          ) : tab === "production" ? (
            productionRows.length === 0 ? (
              <ReportEmptyState tab="production" icon={EmptyIcon} />
            ) : (
              <div className="space-y-4">
                <SubproductDispatchBanner kind="bolsones" />
              <div className={cn("catalog-data-table overflow-x-auto", accentDataSurface.sky)}>
                <table className="w-full min-w-[880px] text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.work}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.order}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.client}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.coils}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.totalKg}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.bolsones}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productionRows.map((row) => (
                      <tr key={row.work_order_id} className={catalogTableRowClass}>
                        <td className={`${catalogTableCellClass} font-mono text-xs font-semibold`}>
                          {row.work_order_code}
                        </td>
                        <td className={catalogTableCellClass}>{row.client_order_code ?? "—"}</td>
                        <td className={catalogTableCellClass}>{row.client_name ?? "—"}</td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums`}>
                          {row.total_coils}
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums font-semibold`}>
                          {formatKgDisplay(row.total_kg)}
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums text-sky-700`}>
                          {formatKgDisplay(row.total_bolsones_kg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            )
          ) : tab === "machine" ? (
            machineRows.length === 0 ? (
              <ReportEmptyState tab="machine" icon={EmptyIcon} />
            ) : (
              <div className="space-y-4">
                {machineRows.map((machine) => (
                  <article key={machine.machine ?? "sin-linea"} className="rounded-xl border border-indigo-200/60 bg-white p-4 shadow-sm">
                    <header className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-indigo-600">{REPORTS_LABELS.columns.machine}</p>
                        <p className="text-lg font-semibold text-slate-900">{machine.machine ?? "—"}</p>
                      </div>
                      <div className="text-right text-sm tabular-nums text-slate-600">
                        {formatKgDisplay(machine.total_kg)} · {machine.coils_count} bob. · {formatKgDisplay(machine.bolsones_kg)} bolsones
                      </div>
                    </header>
                    <div className="mt-3 space-y-3">
                      {machine.shifts.map((shift) => (
                        <div key={`${machine.machine}-${shift.shift}`} className="rounded-lg bg-slate-50/80 p-3">
                          <p className="text-sm font-medium text-slate-800">
                            {REPORTS_LABELS.columns.shift}: {shift.shift ?? "—"} · {formatKgDisplay(shift.total_kg)} · {shift.coils_count} bob.
                          </p>
                          <ul className="mt-2 space-y-1">
                            {shift.orders.map((order) => (
                              <li key={order.work_order_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span>
                                  <span className="font-mono text-xs font-semibold">{order.work_order_code}</span>
                                  {order.client_order_code ? (
                                    <span className="ml-2 text-slate-500">OP {order.client_order_code}</span>
                                  ) : null}
                                </span>
                                <span className="tabular-nums text-slate-700">
                                  {formatKgDisplay(order.total_kg)} · {order.coils_count} bob.
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : wasteRows.length === 0 ? (
            <ReportEmptyState tab="waste" icon={EmptyIcon} />
          ) : (
            <div className="space-y-4">
              <SubproductDispatchBanner kind="desperdicio" />
              {wasteTotal ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className={cn("rounded-lg border px-4 py-3", accentKpi.rose)}>
                    <p className="text-xs font-medium text-rose-800/80">{REPORTS_LABELS.columns.refil}</p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-rose-900">
                      {formatKgDisplay(wasteTotal.refil_kg)}
                    </p>
                  </div>
                  <div className={cn("rounded-lg border px-4 py-3", accentKpi.rose)}>
                    <p className="text-xs font-medium text-rose-800/80">
                      {REPORTS_LABELS.columns.transparente}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-rose-900">
                      {formatKgDisplay(wasteTotal.transparente_kg)}
                    </p>
                  </div>
                  <div className={cn("rounded-lg border px-4 py-3", accentKpi.rose)}>
                    <p className="text-xs font-medium text-rose-800/80">
                      {REPORTS_LABELS.wasteConsolidated}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-rose-900">
                      {formatKgDisplay(wasteTotal.total_kg)}
                    </p>
                  </div>
                </div>
              ) : null}
              <div className={cn("catalog-data-table overflow-x-auto", accentDataSurface.rose)}>
                <table className="w-full min-w-[720px] text-sm">
                  <thead className={tableHeadClass}>
                    <tr>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.order}</th>
                      <th className="px-4 py-3 text-left">{REPORTS_LABELS.columns.work}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.refil}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.transparente}</th>
                      <th className="px-4 py-3 text-right">{REPORTS_LABELS.columns.wasteTotal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRows.map((row) => (
                      <tr key={row.work_order_code} className={catalogTableRowClass}>
                        <td className={catalogTableCellClass}>{row.client_order_code ?? "—"}</td>
                        <td className={`${catalogTableCellClass} font-mono text-xs font-semibold`}>
                          {row.work_order_code}
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums`}>
                          {formatKgDisplay(row.refil_kg)}
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums`}>
                          {formatKgDisplay(row.transparente_kg)}
                        </td>
                        <td className={`${catalogTableCellClass} text-right tabular-nums font-semibold`}>
                          {formatKgDisplay(row.total_kg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </ReportPanelShell>
      </div>
    </PageShell>
  )
}
