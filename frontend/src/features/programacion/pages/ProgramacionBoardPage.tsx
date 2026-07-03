import { Link } from "react-router-dom"
import { ClipboardList, Factory, FlaskConical } from "lucide-react"

import { BOARD_STAGES, type BoardStage } from "@/features/programacion/types"
import { PROGRAMACION_LABELS, boardStageLabel } from "@/features/programacion/labels"
import { useProgramacionBoard } from "@/features/programacion/hooks/useProgramacionBoard"
import { ProductionFlowStrip } from "@/features/production/shared/ProductionFlowStrip"
import { extrusionRegisterHref } from "@/features/production/shared/workProductionResume"
import { ProductionGuidedEmpty } from "@/features/production/shared/ProductionGuidedEmpty"
import { ProductionSectionPanel } from "@/features/production/shared/ProductionSectionPanel"
import { StageTabsWithCounts } from "@/features/production/shared/StageTabsWithCounts"
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
import { CATALOG_LABELS } from "@/shared/catalog/labels"
import { EntityAvatar } from "@/shared/catalog/EntityAvatar"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

function formatPendingQuantity(line: { quantity?: string; unit?: string | null }): string {
  if (!line.quantity) return "—"
  const unit = line.unit?.trim()
  return unit ? `${line.quantity} ${unit}` : line.quantity
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
      {boardStageLabel(stage)}
    </span>
  )
}

export function ProgramacionBoardPage() {
  const {
    loading,
    board,
    stageTab,
    setStageTab,
    stageOrders,
    pendingLines,
    moveStage,
    scheduleLine,
    busyWorkId,
    busyLineId,
  } = useProgramacionBoard()

  const stageTabs = BOARD_STAGES.map((stage) => ({
    id: stage,
    label: boardStageLabel(stage),
    count: board?.columns[stage]?.length ?? 0,
  }))

  const totalWorks = BOARD_STAGES.reduce(
    (sum, stage) => sum + (board?.columns[stage]?.length ?? 0),
    0,
  )

  const stageEmptyTitle = PROGRAMACION_LABELS.emptyStage(boardStageLabel(stageTab))

  return (
    <PageShell
      title={PROGRAMACION_LABELS.title}
      subtitle={PROGRAMACION_LABELS.subtitle}
      icon={ClipboardList}
      meta={
        !loading ? (
          <CatalogCountBadge label={PROGRAMACION_LABELS.count(totalWorks)} />
        ) : null
      }
    >
      <div className="space-y-6">
        <ProductionFlowStrip activeStep="programacion" />

        <ProductionSectionPanel
          title={PROGRAMACION_LABELS.pendingSection}
          highlight={pendingLines.length > 0}
          meta={
            !loading && pendingLines.length > 0 ? (
              <CatalogCountBadge label={PROGRAMACION_LABELS.pendingCount(pendingLines.length)} />
            ) : null
          }
        >
          <table className="w-full text-left text-sm" style={{ minWidth: "960px" }}>
            <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
              <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
                <CatalogTableHead>{PROGRAMACION_LABELS.pendingColumns.code}</CatalogTableHead>
                <CatalogTableHead>{PROGRAMACION_LABELS.pendingColumns.item}</CatalogTableHead>
                <CatalogTableHead>{PROGRAMACION_LABELS.pendingColumns.client}</CatalogTableHead>
                <CatalogTableHead>{PROGRAMACION_LABELS.pendingColumns.product}</CatalogTableHead>
                <CatalogTableHead>{PROGRAMACION_LABELS.pendingColumns.quantity}</CatalogTableHead>
                <CatalogTableHead className="w-36 text-right">
                  {PROGRAMACION_LABELS.pendingColumns.actions}
                </CatalogTableHead>
              </CatalogTableHeadRow>
            </CatalogTableHeader>
            <CatalogTableBody>
              {loading ? (
                <CatalogLoadingRows colSpan={6} />
              ) : pendingLines.length === 0 ? (
                <CatalogEmptyRows colSpan={6}>
                  <CatalogEmptyState
                    compact
                    icon={ClipboardList}
                    title={PROGRAMACION_LABELS.pendingEmpty}
                  />
                </CatalogEmptyRows>
              ) : (
                pendingLines.map((line) => {
                  const clientName = line.client?.name ?? "—"
                  return (
                    <tr key={line.line_id} className={catalogTableRowClass}>
                      <td className={`${catalogTableCellClass} font-mono text-xs font-semibold text-slate-900`}>
                        {line.order_code}
                      </td>
                      <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                        {line.line_seq}
                      </td>
                      <td className={catalogTableCellClass}>
                        <span className="flex min-w-0 items-center gap-2">
                          <EntityAvatar name={clientName} />
                          <span className="truncate font-medium text-slate-700">{clientName}</span>
                        </span>
                      </td>
                      <td className={`${catalogTableCellClass} text-slate-700`}>
                        {line.product?.name ?? "—"}
                      </td>
                      <td className={`${catalogTableCellClass} tabular-nums text-slate-600`}>
                        {formatPendingQuantity(line)}
                      </td>
                      <td className={`${catalogTableCellClass} text-right`}>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyLineId === line.line_id}
                          onClick={() => void scheduleLine(line.client_order_id, line.line_id)}
                        >
                          {busyLineId === line.line_id
                            ? PROGRAMACION_LABELS.scheduling
                            : PROGRAMACION_LABELS.schedule}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </CatalogTableBody>
          </table>
        </ProductionSectionPanel>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              {PROGRAMACION_LABELS.boardSection}
            </h2>
            {!loading ? (
              <span className="text-xs text-slate-500">{CATALOG_LABELS.searchHint}</span>
            ) : null}
          </div>

          <StageTabsWithCounts
            tabs={stageTabs}
            value={stageTab}
            onChange={(id) => setStageTab(id as BoardStage)}
          />

          <ProductionSectionPanel minHeight="320px">
            <table className="w-full text-left text-sm" style={{ minWidth: "1040px" }}>
              <CatalogTableHeader className="catalog-table-head sticky top-0 z-10 bg-white">
                <CatalogTableHeadRow className="border-b border-slate-200 bg-white hover:bg-white">
                  <CatalogTableHead>{PROGRAMACION_LABELS.columns.code}</CatalogTableHead>
                  <CatalogTableHead>{PROGRAMACION_LABELS.columns.client}</CatalogTableHead>
                  <CatalogTableHead>{PROGRAMACION_LABELS.columns.product}</CatalogTableHead>
                  <CatalogTableHead>{PROGRAMACION_LABELS.columns.productionOrder}</CatalogTableHead>
                  <CatalogTableHead className="w-48">{PROGRAMACION_LABELS.columns.stage}</CatalogTableHead>
                  <CatalogTableHead className="w-32 text-right">
                    {PROGRAMACION_LABELS.columns.actions}
                  </CatalogTableHead>
                </CatalogTableHeadRow>
              </CatalogTableHeader>
              <CatalogTableBody>
                {loading ? (
                  <CatalogLoadingRows colSpan={6} />
                ) : stageOrders.length === 0 ? (
                  <CatalogEmptyRows colSpan={6}>
                    <ProductionGuidedEmpty
                      compact
                      icon={ClipboardList}
                      title={stageEmptyTitle}
                      primaryAction={
                        pendingLines.length > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              const first = pendingLines[0]
                              if (first) void scheduleLine(first.client_order_id, first.line_id)
                            }}
                          >
                            {PROGRAMACION_LABELS.emptyStageScheduleCta}
                          </Button>
                        ) : (
                          <Button type="button" size="sm" asChild>
                            <Link to="/orden-produccion/nueva">
                              {PROGRAMACION_LABELS.emptyStageCreateOrder}
                            </Link>
                          </Button>
                        )
                      }
                    />
                  </CatalogEmptyRows>
                ) : (
                  stageOrders.map((order) => {
                    const stage = order.board_stage ?? stageTab
                    const isMezclaStage = stage === "mezcla"
                    const hasActiveExtrusion = board?.active_extrusion_work_order_ids?.includes(order.id) ?? false
                    const isExtrusionStage = stage === "extrusion" || hasActiveExtrusion
                    const clientName = order.client?.name ?? "—"
                    return (
                      <tr key={order.id} className={catalogTableRowClass}>
                        <td className={`${catalogTableCellClass} font-mono text-xs font-semibold text-slate-900`}>
                          {order.code}
                        </td>
                        <td className={catalogTableCellClass}>
                          <span className="flex min-w-0 items-center gap-2">
                            <EntityAvatar name={clientName} />
                            <span className="truncate font-medium text-slate-700">{clientName}</span>
                          </span>
                        </td>
                        <td className={`${catalogTableCellClass} text-slate-700`}>
                          {order.product?.name ?? "—"}
                        </td>
                        <td className={`${catalogTableCellClass} font-mono text-xs text-slate-600`}>
                          {order.production_order?.code ?? "—"}
                        </td>
                        <td className={catalogTableCellClass}>
                          <select
                            className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm focus:border-violet-300 focus:outline-none focus:ring-1 focus:ring-violet-300"
                            value={order.board_stage ?? stageTab}
                            disabled={busyWorkId === order.id}
                            onChange={(e) => void moveStage(order.id, e.target.value)}
                          >
                            {BOARD_STAGES.map((stage) => (
                              <option key={stage} value={stage}>
                                {boardStageLabel(stage)}
                              </option>
                            ))}
                          </select>
                          <div className="mt-1.5 sm:hidden">
                            <StageBadge stage={order.board_stage ?? stageTab} />
                          </div>
                        </td>
                        <td className={`${catalogTableCellClass} text-right`}>
                          <Button
                            type="button"
                            variant={isMezclaStage || isExtrusionStage ? "default" : "ghost"}
                            size="sm"
                            className={
                              isMezclaStage || isExtrusionStage
                                ? undefined
                                : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                            }
                            asChild
                          >
                            {isExtrusionStage ? (
                              <Link to={extrusionRegisterHref(order.id)}>
                                <Factory className="h-3.5 w-3.5" aria-hidden />
                                {PROGRAMACION_LABELS.continueExtrusion}
                              </Link>
                            ) : (
                              <Link to={`/mezcla?work_order_id=${order.id}`}>
                                <FlaskConical className="h-3.5 w-3.5" aria-hidden />
                                {PROGRAMACION_LABELS.viewMixtures}
                              </Link>
                            )}
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </CatalogTableBody>
            </table>
          </ProductionSectionPanel>
        </section>
      </div>
    </PageShell>
  )
}
