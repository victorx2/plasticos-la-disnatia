import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchSuppliers, setSupplierActive } from "@/features/masters/suppliers/api"
import { SUPPLIER_LABELS } from "@/features/masters/suppliers/labels"
import type { Supplier, SupplierViewTab } from "@/features/masters/suppliers/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"
import { ApiError } from "@/shared/api/client"

export function useSuppliersList() {
  const [viewTab, setViewTab] = useState<SupplierViewTab>("active")
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchSuppliers({
        ...query,
        active: viewTab === "inactive" ? 0 : 1,
      }),
    [viewTab],
  )

  const { setPage, reload, ...list } = usePaginatedList<Supplier>({
    fetchPage,
    loadErrorMessage: SUPPLIER_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [viewTab, setPage])

  async function toggleActive(supplier: Supplier) {
    setTogglingId(supplier.id)
    try {
      const nextActive = !supplier.active
      await setSupplierActive(supplier.id, nextActive)
      toast.success(nextActive ? SUPPLIER_LABELS.toggleActivated : SUPPLIER_LABELS.toggleDeactivated)
      if (nextActive) setViewTab("active")
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : SUPPLIER_LABELS.toggleError
      toast.error(message)
    } finally {
      setTogglingId(null)
    }
  }

  return {
    ...list,
    setPage,
    reload,
    viewTab,
    setViewTab,
    togglingId,
    toggleActive,
  }
}
