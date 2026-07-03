import { Boxes } from "lucide-react"

import { MaterialsEmptyState } from "@/features/materials/components/MaterialsEmptyState"
import { MaterialsListToolbar } from "@/features/materials/components/MaterialsListToolbar"
import {
  MaterialsTable,
  materialsTableColSpan,
} from "@/features/materials/components/MaterialsTable"
import { LIST_CATEGORY_TABS } from "@/features/materials/domain/categories"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { useMaterialsList } from "@/features/materials/hooks/useMaterialsList"
import type { MaterialCategoryTab } from "@/features/materials/domain/categories"
import { CatalogEmptyState } from "@/shared/catalog/CatalogEmptyState"
import { CatalogListPagination } from "@/shared/catalog/CatalogListPagination"
import { CatalogSearchPanel } from "@/shared/catalog/CatalogSearchPanel"
import {
  CatalogEmptyRows,
  CatalogLoadingRows,
  CatalogTableBody,
} from "@/shared/catalog/CatalogTable"
import { CatalogViewTabs } from "@/shared/catalog/CatalogViewTabs"
import { PageShell } from "@/shared/catalog/PageShell"

export function MaterialsListPage() {
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
    categoryTab,
    setCategoryTab,
  } = useMaterialsList()

  const total = rows?.total ?? 0
  const colSpan = materialsTableColSpan()
  const hasRows = Boolean(rows?.data.length)

  return (
    <PageShell
      title={MATERIAL_LABELS.listTitle}
      subtitle={MATERIAL_LABELS.listSubtitle}
      icon={Boxes}
      action={<MaterialsListToolbar />}
    >
      <div className="space-y-4">
        <CatalogViewTabs
          tabs={LIST_CATEGORY_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
          value={categoryTab}
          onChange={(id) => setCategoryTab(id as MaterialCategoryTab)}
        />

        <CatalogSearchPanel
          id="material-search"
          label={MATERIAL_LABELS.searchLabel}
          placeholder={MATERIAL_LABELS.searchPlaceholder}
          value={query}
          onChange={setQuery}
          onSubmit={applySearchNow}
          countLabel={rows && !loading ? MATERIAL_LABELS.count(total) : null}
        />

        {showInitialSkeleton ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <CatalogTableBody>
              <CatalogLoadingRows colSpan={colSpan} />
            </CatalogTableBody>
          </div>
        ) : hasRows ? (
          <MaterialsTable rows={rows} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <CatalogTableBody>
              <CatalogEmptyRows colSpan={colSpan}>
                {hasActiveFilters ? (
                  <CatalogEmptyState
                    compact
                    icon={Boxes}
                    title={MATERIAL_LABELS.emptyFiltered}
                    description={MATERIAL_LABELS.emptyFilteredDescription}
                  />
                ) : (
                  <MaterialsEmptyState />
                )}
              </CatalogEmptyRows>
            </CatalogTableBody>
          </div>
        )}

        <CatalogListPagination
          rows={rows}
          loading={loading}
          perPage={perPage}
          onPerPageChange={setPerPage}
          onPageChange={setPage}
          selectId="materials-per-page"
        />
      </div>
    </PageShell>
  )
}
