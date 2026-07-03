import { useCallback, useEffect, useState } from "react"

import { fetchNrocOrderTabCounts, fetchNrocOrders } from "@/features/nroc-orders/api"
import type { NrocOrderTabCounts } from "@/features/nroc-orders/api"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrderViewTab } from "@/features/nroc-orders/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export type ProductionBatchOption = {
  id: number
  code: string
}

const EMPTY_TAB_COUNTS: NrocOrderTabCounts = {
  all: 0,
  awaiting_schedule: 0,
  open: 0,
  fulfilled: 0,
}

export function useNrocOrdersList() {
  const [viewTab, setViewTab] = useState<NrocOrderViewTab>("all")
  const [batchFilterId, setBatchFilterId] = useState("")
  const [tabCounts, setTabCounts] = useState<NrocOrderTabCounts>(EMPTY_TAB_COUNTS)
  const [batchOptions, setBatchOptions] = useState<ProductionBatchOption[]>([])
  const [loadingBatchOptions, setLoadingBatchOptions] = useState(true)

  const fetchPage = useCallback(
    async (query: { q?: string; page?: number; per_page?: number }) => {
      const batchId = batchFilterId ? Number(batchFilterId) : undefined
      return fetchNrocOrders({
        ...query,
        batch_id: Number.isFinite(batchId) && batchId! > 0 ? batchId : undefined,
        awaiting_schedule: viewTab === "awaiting_schedule" ? true : undefined,
        status:
          viewTab === "open" ? "open" : viewTab === "fulfilled" ? "fulfilled" : undefined,
        sort: "desc",
      })
    },
    [viewTab, batchFilterId],
  )

  const { setPage, search, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: PRODUCTION_ORDER_LABELS.loadError,
  })

  const loadTabCounts = useCallback(async () => {
    const batchId = batchFilterId ? Number(batchFilterId) : undefined
    try {
      const counts = await fetchNrocOrderTabCounts({
        q: search || undefined,
        batch_id: Number.isFinite(batchId) && batchId! > 0 ? batchId : undefined,
      })
      setTabCounts(counts)
    } catch {
      setTabCounts(EMPTY_TAB_COUNTS)
    }
  }, [batchFilterId, search])

  useEffect(() => {
    let cancelled = false
    setLoadingBatchOptions(true)
    void (async () => {
      try {
        const orders = await fetchAllPages(fetchNrocOrders, { sort: "desc" })
        if (cancelled) return
        const map = new Map<number, string>()
        for (const order of orders) {
          if (order.batch_id && order.batch_code) {
            map.set(order.batch_id, order.batch_code)
          }
        }
        setBatchOptions(
          [...map.entries()]
            .map(([id, code]) => ({ id, code }))
            .sort((a, b) => a.code.localeCompare(b.code)),
        )
      } catch {
        if (!cancelled) setBatchOptions([])
      } finally {
        if (!cancelled) setLoadingBatchOptions(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadTabCounts()
  }, [loadTabCounts])

  useEffect(() => {
    setPage(1)
  }, [viewTab, batchFilterId, setPage])

  const activeBatchCode =
    batchOptions.find((batch) => String(batch.id) === batchFilterId)?.code ?? null

  return {
    ...list,
    setPage,
    search,
    viewTab,
    setViewTab,
    batchFilterId,
    setBatchFilterId,
    tabCounts,
    batchOptions,
    loadingBatchOptions,
    activeBatchCode,
    hasActiveFilters: list.hasActiveFilters || Boolean(batchFilterId),
  }
}
