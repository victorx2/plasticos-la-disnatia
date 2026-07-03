import { useCallback, useEffect, useState } from "react"

import { fetchProducts } from "@/features/masters/products/api"
import { PRODUCT_LABELS } from "@/features/masters/products/labels"
import type { Product } from "@/features/masters/products/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useProductsList() {
  const [clientFilter, setClientFilter] = useState("all")

  const fetchPage = useCallback(
    async (query: { q?: string; page?: number; per_page?: number }) => {
      const clientId =
        clientFilter !== "all" ? Number(clientFilter) : undefined
      return fetchProducts({
        ...query,
        client_id:
          clientId != null && Number.isFinite(clientId) && clientId > 0
            ? clientId
            : undefined,
      })
    },
    [clientFilter],
  )

  const { setPage, ...list } = usePaginatedList<Product>({
    fetchPage,
    loadErrorMessage: PRODUCT_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [clientFilter, setPage])

  return {
    ...list,
    setPage,
    clientFilter,
    setClientFilter,
    hasActiveFilters: list.hasActiveFilters || clientFilter !== "all",
  }
}
