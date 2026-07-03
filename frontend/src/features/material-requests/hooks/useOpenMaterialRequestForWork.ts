import { useCallback, useEffect, useState } from "react"

import { fetchMaterialRequestForWork } from "@/features/material-requests/api"
import {
  materialRequestHasPendingDispatch,
} from "@/features/material-requests/domain/openMaterialRequest"
import type { MaterialRequestDetail } from "@/features/material-requests/types"

export function useOpenMaterialRequestForWork(workOrderId: number | null) {
  const [openRequest, setOpenRequest] = useState<MaterialRequestDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(workOrderId))

  const load = useCallback(async () => {
    if (workOrderId == null || workOrderId <= 0) {
      setOpenRequest(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const request = await fetchMaterialRequestForWork(workOrderId)
      setOpenRequest(request && materialRequestHasPendingDispatch(request) ? request : null)
    } catch {
      setOpenRequest(null)
    } finally {
      setLoading(false)
    }
  }, [workOrderId])

  useEffect(() => {
    void load()
  }, [load])

  return { openRequest, loading, reload: load }
}
