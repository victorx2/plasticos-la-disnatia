import { Link } from "react-router-dom"
import { Layers, Package, Plus, Users } from "lucide-react"

import { ProductsListPanel } from "@/features/masters/products/components/ProductsListPanel"
import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import { useProductsList } from "@/features/masters/products/hooks/useProductsList"
import { useClientOptions } from "@/features/masters/shared/hooks/useClientOptions"
import { CatalogCountBadge } from "@/shared/catalog/CatalogCountBadge"
import { CatalogSearchHint } from "@/shared/catalog/CatalogSearchHint"
import { PageShell } from "@/shared/catalog/PageShell"
import { Button } from "@/shared/ui/button"

export function ProductsListPage() {
  const { clients, loading: loadingClients } = useClientOptions()
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
    clientFilter,
    setClientFilter,
  } = useProductsList()

  const total = rows?.total ?? 0

  const newProductButton = (
    <Button type="button" asChild>
      <Link to="/productos/form">
        <Plus className="h-4 w-4" aria-hidden />
        {PRODUCT_LABELS.newProduct}
      </Link>
    </Button>
  )

  return (
    <PageShell
      title={PRODUCT_LABELS.listTitle}
      subtitle={PRODUCT_LABELS.listSubtitle}
      subtitleIcon={Layers}
      meta={rows && !loading ? <CatalogCountBadge label={PRODUCT_LABELS.count(total)} /> : null}
      icon={Package}
      action={newProductButton}
    >
      <CatalogSearchHint />
      <ProductsListPanel
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={applySearchNow}
        loading={loading}
        showInitialSkeleton={showInitialSkeleton}
        hasActiveFilters={hasActiveFilters}
        rows={rows}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onPageChange={setPage}
        clients={clients}
        loadingClients={loadingClients}
        clientFilter={clientFilter}
        onClientFilterChange={setClientFilter}
        newProductButton={newProductButton}
      />
    </PageShell>
  )
}
