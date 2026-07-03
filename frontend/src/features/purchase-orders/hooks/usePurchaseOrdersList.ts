import { useCallback, useEffect, useState } from "react"

import { fetchPurchaseOrders } from "@/features/purchase-orders/api"
import { PURCHASE_ORDER_LABELS } from "@/features/purchase-orders/labels"
import type { PurchaseOrder, PurchaseOrderViewTab } from "@/features/purchase-orders/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function usePurchaseOrdersList() {
  const [viewTab, setViewTab] = useState<PurchaseOrderViewTab>("pending")
  const [supplierFilter, setSupplierFilter] = useState("all")

  const fetchPage = useCallback(
    async (query: { q?: string; page?: number; per_page?: number }) => {
      const supplierId =
        supplierFilter !== "all" ? Number(supplierFilter) : undefined
      return fetchPurchaseOrders({
        ...query,
        supplier_id:
          supplierId != null && Number.isFinite(supplierId) && supplierId > 0
            ? supplierId
            : undefined,
        has_receipts: viewTab === "history",
        visibility: "active",
      })
    },
    [supplierFilter, viewTab],
  )

  const { setPage, ...list } = usePaginatedList<PurchaseOrder>({
    fetchPage,
    loadErrorMessage: PURCHASE_ORDER_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [viewTab, supplierFilter, setPage])

  return {
    ...list,
    setPage,
    viewTab,
    setViewTab,
    supplierFilter,
    setSupplierFilter,
    hasActiveFilters: list.hasActiveFilters || supplierFilter !== "all",
  }
}
