import { useCallback, useEffect, useState } from "react"

import { fetchPurchaseOrders } from "@/features/purchase-orders/api"
import { fetchPurchaseReceipts } from "@/features/purchase-receipts/api"
import { PURCHASE_RECEIPT_LABELS } from "@/features/purchase-receipts/labels"
import type { PurchaseOrder } from "@/features/purchase-orders/types"
import type { PurchaseReceipt, PurchaseReceiptViewTab } from "@/features/purchase-receipts/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function usePurchaseReceiptsList() {
  const [viewTab, setViewTab] = useState<PurchaseReceiptViewTab>("pending")
  const [supplierFilter, setSupplierFilter] = useState("")
  const [invoiceFilter, setInvoiceFilter] = useState("")
  const [fromFilter, setFromFilter] = useState("")
  const [toFilter, setToFilter] = useState("")

  const fetchReceiptsPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchPurchaseReceipts({
        ...query,
        supplier_name: supplierFilter.trim() || undefined,
        invoice_number: invoiceFilter.trim() || undefined,
        material_term: query.q || undefined,
        from: fromFilter || undefined,
        to: toFilter || undefined,
      }),
    [supplierFilter, invoiceFilter, fromFilter, toFilter],
  )

  const fetchPendingPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchPurchaseOrders({
        ...query,
        has_receipts: false,
        visibility: "active",
      }),
    [],
  )

  const historyList = usePaginatedList<PurchaseReceipt>({
    fetchPage: fetchReceiptsPage,
    loadErrorMessage: PURCHASE_RECEIPT_LABELS.loadError,
  })

  const pendingList = usePaginatedList<PurchaseOrder>({
    fetchPage: fetchPendingPage,
    loadErrorMessage: PURCHASE_RECEIPT_LABELS.loadError,
  })

  const activeList = viewTab === "history" ? historyList : pendingList

  useEffect(() => {
    historyList.setPage(1)
  }, [supplierFilter, invoiceFilter, fromFilter, toFilter, historyList.setPage])

  useEffect(() => {
    pendingList.setPage(1)
  }, [viewTab, pendingList.setPage])

  return {
    viewTab,
    setViewTab,
    supplierFilter,
    setSupplierFilter,
    invoiceFilter,
    setInvoiceFilter,
    fromFilter,
    setFromFilter,
    toFilter,
    setToFilter,
    query: activeList.query,
    setQuery: activeList.setQuery,
    setPage: activeList.setPage,
    perPage: activeList.perPage,
    setPerPage: activeList.setPerPage,
    applySearchNow: activeList.applySearchNow,
    historyRows: historyList.rows,
    pendingRows: pendingList.rows,
    historyLoading: historyList.loading,
    pendingLoading: pendingList.loading,
    hasActiveFilters:
      activeList.hasActiveFilters ||
      supplierFilter.trim() !== "" ||
      invoiceFilter.trim() !== "" ||
      fromFilter !== "" ||
      toFilter !== "",
  }
}
