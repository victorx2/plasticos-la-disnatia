import { Link } from "react-router-dom"
import { Building2, Plus, UserCheck, Users, UserX } from "lucide-react"

import { getSessionAppRole, isInventoryRole } from "@/config/permissions"
import { ClientsListPanel } from "@/features/masters/clients/components/ClientsListPanel"
import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import { useClientsList } from "@/features/masters/clients/hooks/useClientsList"
import { PageShell } from "@/shared/catalog/PageShell"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { getStoredUser } from "@/shared/auth/session"
import { Button } from "@/shared/ui/button"

export function ClientsListPage() {
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
  } = useClientsList()

  const total = rows?.total ?? 0
  const isInactiveTab = viewTab === "inactive"
  const searchPlaceholder = inventoryView
    ? CLIENT_LABELS.searchPlaceholderInventory
    : CLIENT_LABELS.searchPlaceholder

  const newClientButton = (
    <Button type="button" asChild>
      <Link to="/clientes/form">
        <Plus className="h-4 w-4" aria-hidden />
        {CLIENT_LABELS.newClient}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={CLIENT_LABELS.listTitle}
      subtitle={CLIENT_LABELS.listSubtitle}
      subtitleIcon={Building2}
      meta={rows && !loading ? <CatalogCountBadge label={CLIENT_LABELS.count(total)} /> : null}
      icon={Users}
      action={newClientButton}
    >
      <CatalogSearchHint />
      <CatalogViewTabs
        tabs={[
          { id: "active", label: CLIENT_LABELS.tabs.active, icon: UserCheck },
          { id: "inactive", label: CLIENT_LABELS.tabs.inactive, icon: UserX },
        ]}
        value={viewTab}
        onChange={(id) => setViewTab(id as "active" | "inactive")}
      />
      <ClientsListPanel
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
        searchPlaceholder={searchPlaceholder}
        newClientButton={newClientButton}
        togglingId={togglingId}
        onToggleActive={toggleActive}
      />
    </PageShell>
  )
}
