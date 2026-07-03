import { Link } from "react-router-dom"
import { Plus, ShoppingBag, Truck, UserCheck, UserX } from "lucide-react"

import { getSessionAppRole, isInventoryRole } from "@/config/permissions"
import { SuppliersListPanel } from "@/features/masters/suppliers/components/SuppliersListPanel"
import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import { useSuppliersList } from "@/features/masters/suppliers/hooks/useSuppliersList"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { PageShell } from "@/shared/catalog/PageShell"
import { getStoredUser } from "@/shared/auth/session"
import { Button } from "@/shared/ui/button"

export function SuppliersListPage() {
  const role = getSessionAppRole(getStoredUser())
  const inventoryView = isInventoryRole(role)

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
    togglingId,
    toggleActive,
  } = useSuppliersList()

  const total = rows?.total ?? 0
  const isInactiveTab = viewTab === "inactive"

  const newSupplierButton = (
    <Button type="button" asChild>
      <Link to="/proveedores/form">
        <Plus className="h-4 w-4" aria-hidden />
        {SUPPLIER_LABELS.newSupplier}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={SUPPLIER_LABELS.listTitle}
      subtitle={SUPPLIER_LABELS.listSubtitle}
      subtitleIcon={ShoppingBag}
      meta={rows && !loading ? <CatalogCountBadge label={SUPPLIER_LABELS.count(total)} /> : null}
      icon={Truck}
      action={newSupplierButton}
    >
      <CatalogSearchHint />
      <CatalogViewTabs
        tabs={[
          { id: "active", label: SUPPLIER_LABELS.tabs.active, icon: UserCheck },
          { id: "inactive", label: SUPPLIER_LABELS.tabs.inactive, icon: UserX },
        ]}
        value={viewTab}
        onChange={(id) => setViewTab(id as "active" | "inactive")}
      />
      <SuppliersListPanel
        inventoryView={inventoryView}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={applySearchNow}
        loading={loading}
        showInitialSkeleton={showInitialSkeleton}
        hasActiveFilters={hasActiveFilters}
        isInactiveTab={isInactiveTab}
        rows={rows}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onPageChange={setPage}
        newSupplierButton={newSupplierButton}
        togglingId={togglingId}
        onToggleActive={toggleActive}
      />
    </PageShell>
  )
}
