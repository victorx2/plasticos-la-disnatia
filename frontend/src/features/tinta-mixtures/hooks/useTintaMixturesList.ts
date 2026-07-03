import { useCallback, useEffect, useState } from "react"

import { fetchTintaMixtures } from "@/features/tinta-mixtures/api"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useTintaMixturesList(workOrderId: number | null) {
  const [workFilter, setWorkFilter] = useState(
    workOrderId != null && workOrderId > 0 ? String(workOrderId) : "",
  )

  useEffect(() => {
    if (workOrderId != null && workOrderId > 0) {
      setWorkFilter(String(workOrderId))
    }
  }, [workOrderId])

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) => {
      const id = workFilter ? Number(workFilter) : undefined
      return fetchTintaMixtures({
        ...query,
        work_order_id: id != null && Number.isFinite(id) && id > 0 ? id : undefined,
      })
    },
    [workFilter],
  )

  const list = usePaginatedList({
    fetchPage,
    loadErrorMessage: MIXING_LABELS.loadError,
  })

  const { setPage } = list

  useEffect(() => {
    setPage(1)
  }, [workFilter, setPage])

  return {
    ...list,
    workFilter,
    setWorkFilter,
    hasWorkFilter: workFilter !== "",
  }
}
