import { useCallback, useEffect, useState } from "react"

import type { MaterialCategoryTab } from "@/features/materials/domain/categories"
import { fetchMaterials } from "@/features/materials/api"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useMaterialsList() {
  const [categoryTab, setCategoryTab] = useState<MaterialCategoryTab>("all")

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchMaterials({
        ...query,
        inventory_area: categoryTab === "all" ? undefined : categoryTab,
      }),
    [categoryTab],
  )

  const { setPage, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: MATERIAL_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [categoryTab, setPage])

  return {
    ...list,
    setPage,
    categoryTab,
    setCategoryTab,
  }
}
