import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  fetchAlerts,
  markAlertRead,
  markAllAlertsRead,
  syncOperationalAlerts,
} from "@/features/alerts/api"
import { ALERT_LABELS } from "@/features/alerts/labels"
import { ApiError } from "@/shared/api/client"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"

export function useAlertsList() {
  const [unreadOnly, setUnreadOnly] = useState(true)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) =>
      fetchAlerts({
        page: query.page,
        per_page: query.per_page,
        unread_only: unreadOnly,
      }).then((data) => {
        setUnreadTotal(data.unread_total)
        return data
      }),
    [unreadOnly],
  )

  const { setPage, reload, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: ALERT_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [unreadOnly, setPage])

  async function syncAndReload() {
    setSyncing(true)
    try {
      await syncOperationalAlerts()
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : ALERT_LABELS.syncError
      toast.error(message)
    } finally {
      setSyncing(false)
    }
  }

  async function markOneRead(id: number) {
    setMarkingId(id)
    try {
      await markAlertRead(id)
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : ALERT_LABELS.markReadError
      toast.error(message)
    } finally {
      setMarkingId(null)
    }
  }

  async function markAllRead() {
    setMarkingAll(true)
    try {
      const result = await markAllAlertsRead()
      toast.success(ALERT_LABELS.markAllReadSuccess(result.updated))
      await reload()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : ALERT_LABELS.markAllReadError
      toast.error(message)
    } finally {
      setMarkingAll(false)
    }
  }

  return {
    ...list,
    setPage,
    reload,
    unreadOnly,
    setUnreadOnly,
    unreadTotal,
    markOneRead,
    markAllRead,
    syncAndReload,
    markingId,
    markingAll,
    syncing,
    hasActiveFilters: list.hasActiveFilters || unreadOnly,
  }
}
