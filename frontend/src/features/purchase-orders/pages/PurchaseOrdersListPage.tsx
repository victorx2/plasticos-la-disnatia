import { Link } from "react-router-dom"
import { ClipboardList, Clock, PackageCheck, Plus, ShoppingCart } from "lucide-react"

import { useSupplierOptions } from "@/features/masters/shared/hooks/useSupplierOptions"
import { PurchaseOrdersListPanel } from "@/features/purchase-orders/components/PurchaseOrdersListPanel"
import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import { usePurchaseOrdersList } from "@/features/purchase-orders/hooks/usePurchaseOrdersList"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

export function PurchaseOrdersListPage() {
  const { suppliers, loading: loadingSuppliers } = useSupplierOptions()
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
    supplierFilter,
    setSupplierFilter,
  } = usePurchaseOrdersList()

  const total = rows?.total ?? 0
  const isHistoryTab = viewTab === "history"

  const newOrderButton = (
    <Button type="button" asChild>
      <Link to="/ordenes-compra/nueva">
        <Plus className="h-4 w-4" aria-hidden />
        {PURCHASE_ORDER_LABELS.newOrder}
      </Link>
    </Button>
  )

  const tabs = (
    <CatalogViewTabs
      tabs={[
        { id: "pending", label: PURCHASE_ORDER_LABELS.tabs.pending, icon: Clock },
        { id: "history", label: PURCHASE_ORDER_LABELS.tabs.history, icon: PackageCheck },
      ]}
      value={viewTab}
      onChange={(id) => setViewTab(id as "pending" | "history")}
    />
  )

  return (
    <PageShell
      title={PURCHASE_ORDER_LABELS.listTitle}
      subtitle={PURCHASE_ORDER_LABELS.listSubtitle}
      subtitleIcon={ClipboardList}
      meta={rows && !loading ? <CatalogCountBadge label={PURCHASE_ORDER_LABELS.count(total)} /> : null}
      icon={ShoppingCart}
      action={newOrderButton}
    >
      <CatalogSearchHint />
      <PurchaseOrdersListPanel
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={applySearchNow}
        loading={loading}
        showInitialSkeleton={showInitialSkeleton}
        hasActiveFilters={hasActiveFilters}
        isHistoryTab={isHistoryTab}
        rows={rows}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onPageChange={setPage}
        tabs={tabs}
        suppliers={suppliers}
        loadingSuppliers={loadingSuppliers}
        supplierFilter={supplierFilter}
        onSupplierFilterChange={setSupplierFilter}
        newOrderButton={newOrderButton}
      />
    </PageShell>
  )
}
