import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchDashboardSummary } from "@/features/dashboard/api"
import { DASHBOARD_LABELS } from "@/features/dashboard/labels"
import { buildDashboardViewModel } from "@/features/dashboard/map-summary"
import type { DashboardViewModel } from "@/features/dashboard/types"
import { ApiError } from "@/shared/api/client"

export function useDashboardSummary() {
  const [loading, setLoading] = useState(true)
  const [viewModel, setViewModel] = useState<DashboardViewModel | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const summary = await fetchDashboardSummary()
      setViewModel(buildDashboardViewModel(summary))
    } catch (error) {
      setViewModel(null)
      const message =
        error instanceof ApiError ? error.message : DASHBOARD_LABELS.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { loading, viewModel, reload }
}
