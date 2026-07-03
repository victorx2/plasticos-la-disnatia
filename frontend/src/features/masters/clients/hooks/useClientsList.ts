import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchClients, setClientActive } from "@/features/masters/clients/api"
import { CLIENT_LABELS } from "@/features/masters/clients/labels"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"
import type { Client, ClientViewTab } from "@/features/masters/clients/types"
import { ApiError } from "@/shared/api/client"

export function useClientsList() {
  const [viewTab, setViewTab] = useState<ClientViewTab>("active")
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchClients({
        ...query,
        active: viewTab === "inactive" ? 0 : 1,
      }),
    [viewTab],
  )

  const { setPage, reload, ...list } = usePaginatedList<Client>({
    fetchPage,
    loadErrorMessage: CLIENT_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [viewTab, setPage])

  async function toggleActive(client: Client) {
    setTogglingId(client.id)
    try {
      const nextActive = !client.active
      await setClientActive(client.id, nextActive)
      toast.success(nextActive ? CLIENT_LABELS.toggleActivated : CLIENT_LABELS.toggleDeactivated)
      if (nextActive) setViewTab("active")
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : CLIENT_LABELS.toggleError
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
