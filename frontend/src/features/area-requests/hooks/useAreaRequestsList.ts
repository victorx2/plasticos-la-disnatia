import { useCallback, useEffect, useState } from "react"

import { fetchAreaRequests, fetchWarehousePendingCount } from "@/features/area-requests/api"
import { AREA_REQUEST_LABELS } from "@/features/area-requests/labels"
import type { WarehousePendingCount } from "@/features/area-requests/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useAreaRequestsList() {
  const [areaFilter, setAreaFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [pendingCount, setPendingCount] = useState<WarehousePendingCount | null>(null)

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchAreaRequests({
        ...query,
        area: areaFilter || undefined,
        status: statusFilter || undefined,
        insumos_only: true,
        insumos_origin: "manual",
      }),
    [areaFilter, statusFilter],
  )

  const { setPage, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: AREA_REQUEST_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [areaFilter, statusFilter, setPage])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await fetchWarehousePendingCount()
        if (!cancelled) setPendingCount(data)
      } catch {
        if (!cancelled) setPendingCount(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [list.rows])

  return {
    ...list,
    setPage,
    areaFilter,
    setAreaFilter,
    statusFilter,
    setStatusFilter,
    pendingCount,
    hasActiveFilters: list.hasActiveFilters || areaFilter !== "" || statusFilter !== "",
  }
}
