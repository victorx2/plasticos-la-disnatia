import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchVendors, setVendorActive } from "@/features/masters/vendors/api"
import { VENDOR_LABELS } from "@/features/masters/vendors/labels"
import type { Vendor, VendorViewTab } from "@/features/masters/vendors/types"
import { ApiError } from "@/shared/api/client"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useVendorsList() {
  const [viewTab, setViewTab] = useState<VendorViewTab>("active")
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchPage = useCallback(
    async (query: { q?: string; page?: number; per_page?: number }) =>
      fetchVendors({
        ...query,
        active: viewTab === "inactive" ? 0 : 1,
      }),
    [viewTab],
  )

  const { setPage, reload, ...list } = usePaginatedList<Vendor>({
    fetchPage,
    loadErrorMessage: VENDOR_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [viewTab, setPage])

  async function toggleActive(vendor: Vendor) {
    setTogglingId(vendor.id)
    try {
      const nextActive = !vendor.active
      await setVendorActive(vendor.id, nextActive)
      toast.success(nextActive ? VENDOR_LABELS.toggleActivated : VENDOR_LABELS.toggleDeactivated)
      if (nextActive) setViewTab("active")
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : VENDOR_LABELS.toggleError
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
