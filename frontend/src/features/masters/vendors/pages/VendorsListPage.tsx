import { Link } from "react-router-dom"
import { Link2, Plus, UserCheck, Users, UserX } from "lucide-react"

import { VendorsListPanel } from "@/features/masters/vendors/components/VendorsListPanel"
import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import { useVendorsList } from "@/features/masters/vendors/hooks/useVendorsList"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

export function VendorsListPage() {
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
  } = useVendorsList()

  const total = rows?.total ?? 0
  const isInactiveTab = viewTab === "inactive"

  const newVendorButton = (
    <Button type="button" asChild>
      <Link to="/vendedores/form">
        <Plus className="h-4 w-4" aria-hidden />
        {VENDOR_LABELS.newVendor}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={VENDOR_LABELS.listTitle}
      subtitle={VENDOR_LABELS.listSubtitle}
      subtitleIcon={Link2}
      meta={rows && !loading ? <CatalogCountBadge label={VENDOR_LABELS.count(total)} /> : null}
      icon={Users}
      action={newVendorButton}
    >
      <CatalogSearchHint />
      <CatalogViewTabs
        tabs={[
          { id: "active", label: VENDOR_LABELS.tabs.active, icon: UserCheck },
          { id: "inactive", label: VENDOR_LABELS.tabs.inactive, icon: UserX },
        ]}
        value={viewTab}
        onChange={(id) => setViewTab(id as "active" | "inactive")}
      />
      <VendorsListPanel
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
        togglingId={togglingId}
        onToggleActive={(vendor) => toggleActive(vendor)}
        newVendorButton={newVendorButton}
      />
    </PageShell>
  )
}
