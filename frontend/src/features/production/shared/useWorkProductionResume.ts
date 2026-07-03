import { useCallback, useEffect, useState } from "react"

import {
  fetchWorkProductionResume,
  type WorkProductionResume,
} from "@/features/production/shared/workProductionResume"

export function useWorkProductionResume(workOrderId?: number | null) {
  const validId =
    workOrderId != null && Number.isFinite(workOrderId) && workOrderId > 0 ? workOrderId : null

  const [resume, setResume] = useState<WorkProductionResume | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!validId) {
      setResume(null)
      return null
    }
    setLoading(true)
    try {
      const data = await fetchWorkProductionResume(validId)
      setResume(data)
      return data
    } catch {
      setResume(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [validId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { resume, loading, reload }
}
