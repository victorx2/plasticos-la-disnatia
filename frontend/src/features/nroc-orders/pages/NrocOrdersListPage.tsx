import { Link } from "react-router-dom"
import { useState } from "react"
import { ClipboardList, Layers, Package, Plus, ScrollText, UserPlus } from "lucide-react"

import { ProductionOrderHistoryDialog } from "@/features/nroc-orders/components/ProductionOrderHistoryDialog"
import { ProductionOrderListPanel } from "@/features/nroc-orders/components/list"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import { useNrocOrdersList } from "@/features/nroc-orders/hooks/useNrocOrdersList"
import type { NrocOrderViewTab } from "@/features/nroc-orders/types"
import { StageTabsWithCounts } from "@/features/production/shared/StageTabsWithCounts"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { PageShell } from "@/shared/catalog/PageShell"
import { cn } from "@/shared/lib/utils"
import { buildMasterFormHref } from "@/shared/navigation/masterFormReturn"
import { Button } from "@/shared/ui/button"

export function NrocOrdersListPage() {
  const [historyOrder, setHistoryOrder] = useState<{ id: number; code: string } | null>(null)
  const {
    query,
    setQuery,
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    applySearchNow,
    hasActiveFilters,
    showInitialSkeleton,
    viewTab,
    setViewTab,
    batchFilterId,
    setBatchFilterId,
    tabCounts,
    batchOptions,
    loadingBatchOptions,
    activeBatchCode,
  } = useNrocOrdersList()

  const total = rows?.total ?? 0

  const newOrderButton = (
    <Button type="button" asChild>
      <Link to="/orden-produccion/nueva">
        <Plus className="h-4 w-4" aria-hidden />
        {PRODUCTION_ORDER_LABELS.newOrder}
      </Link>
    </Button>
  )

  const batchSelectClassName = cn(
    "h-9 min-w-[11rem] rounded-lg border px-3 text-sm shadow-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30",
    batchFilterId
      ? "border-violet-300 bg-violet-50 font-medium text-violet-800 ring-1 ring-violet-200/80"
      : "border-slate-200 bg-white text-slate-700",
  )

  const listActions = (
    <div className="flex flex-wrap items-center gap-2">
      {newOrderButton}
      <Button type="button" variant="outline" className="gap-1.5" asChild>
        <Link to={buildMasterFormHref("/clientes/form", { returnTo: "/orden-produccion/nueva" })}>
          <UserPlus className="h-4 w-4" aria-hidden />
          {PRODUCTION_ORDER_LABELS.newClient}
        </Link>
      </Button>
      <Button type="button" variant="outline" className="gap-1.5" asChild>
        <Link to={buildMasterFormHref("/productos/form", { returnTo: "/orden-produccion/nueva" })}>
          <Package className="h-4 w-4" aria-hidden />
          {PRODUCTION_ORDER_LABELS.newProduct}
        </Link>
      </Button>
      {batchOptions.length > 0 || loadingBatchOptions ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="nroc-batch-filter"
            className={batchSelectClassName}
            value={batchFilterId}
            disabled={loadingBatchOptions}
            aria-label={PRODUCTION_ORDER_LABELS.addToBatchSelect}
            onChange={(e) => setBatchFilterId(e.target.value)}
          >
            <option value="">{PRODUCTION_ORDER_LABELS.addToBatchSelect}</option>
            {batchOptions.map((batch) => (
              <option key={batch.id} value={String(batch.id)}>
                {batch.code}
              </option>
            ))}
          </select>
          {batchFilterId && activeBatchCode ? (
            <Button type="button" asChild className="gap-1.5 bg-indigo-600 shadow-sm hover:bg-indigo-700">
              <Link to={`/orden-produccion/nueva?batch_id=${batchFilterId}`}>
                <Plus className="h-4 w-4" aria-hidden />
                {PRODUCTION_ORDER_LABELS.addToBatchGo}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              className="gap-1.5 border-violet-200 bg-violet-50 text-violet-400 shadow-none"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {PRODUCTION_ORDER_LABELS.addToBatchGo}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  )

  const tabs = (
    <StageTabsWithCounts
      tabs={[
        { id: "all", label: PRODUCTION_ORDER_LABELS.tabs.all, count: tabCounts.all },
        {
          id: "awaiting_schedule",
          label: PRODUCTION_ORDER_LABELS.tabs.awaitingSchedule,
          count: tabCounts.awaiting_schedule,
        },
        { id: "open", label: PRODUCTION_ORDER_LABELS.tabs.open, count: tabCounts.open },
        {
          id: "fulfilled",
          label: PRODUCTION_ORDER_LABELS.tabs.fulfilled,
          count: tabCounts.fulfilled,
        },
      ]}
      value={viewTab}
      onChange={(id) => setViewTab(id as NrocOrderViewTab)}
    />
  )

  return (
    <PageShell
      title={PRODUCTION_ORDER_LABELS.listTitle}
      subtitle={PRODUCTION_ORDER_LABELS.listSubtitle}
      subtitleIcon={ClipboardList}
      meta={rows && !loading ? <CatalogCountBadge label={PRODUCTION_ORDER_LABELS.count(total)} /> : null}
      icon={ScrollText}
      action={listActions}
    >
      <CatalogSearchHint />
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-violet-950">
          <p className="font-semibold">{PRODUCTION_ORDER_LABELS.mastersCalloutTitle}</p>
          <p className="text-xs text-violet-800">{PRODUCTION_ORDER_LABELS.mastersCalloutBody}</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="default" size="sm" className="gap-1.5" asChild>
            <Link to={buildMasterFormHref("/clientes/form", { returnTo: "/orden-produccion/nueva" })}>
              <UserPlus className="h-4 w-4" aria-hidden />
              {PRODUCTION_ORDER_LABELS.newClient}
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
            <Link to={buildMasterFormHref("/productos/form", { returnTo: "/orden-produccion/nueva" })}>
              <Package className="h-4 w-4" aria-hidden />
              {PRODUCTION_ORDER_LABELS.newProduct}
            </Link>
          </Button>
        </div>
      </div>
      {activeBatchCode ? (
        <p className="-mt-2 flex items-center gap-1.5 text-xs font-medium text-violet-700">
          <Layers className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {PRODUCTION_ORDER_LABELS.addToBatchFilterActive(activeBatchCode)}
        </p>
      ) : null}
      <ProductionOrderListPanel
        loading={loading}
        showInitialSkeleton={showInitialSkeleton}
        hasActiveFilters={hasActiveFilters}
        rows={rows}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onPageChange={setPage}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={applySearchNow}
        tabs={tabs}
        newOrderButton={newOrderButton}
        highlightBatchCode={activeBatchCode}
        onViewHistory={(id, code) => setHistoryOrder({ id, code })}
      />
      <ProductionOrderHistoryDialog
        orderId={historyOrder?.id ?? null}
        orderCode={historyOrder?.code}
        open={historyOrder != null}
        onOpenChange={(open) => {
          if (!open) setHistoryOrder(null)
        }}
      />
    </PageShell>
  )
}
