import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import {
  acceptMaterialRequestCounter,
  fetchMaterialRequest,
  rejectMaterialRequestCounter,
} from "@/features/material-requests/api"
import { MATERIAL_REQUEST_LABELS } from "@/features/material-requests/labels"
import type { MaterialRequestDetail } from "@/features/material-requests/types"
import { ApiError } from "@/shared/api/client"

export function useMaterialRequestReview(materialRequestId: number | null) {
  const [detail, setDetail] = useState<MaterialRequestDetail | null>(null)
  const [loading, setLoading] = useState(Boolean(materialRequestId))
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  const load = useCallback(async () => {
    if (!materialRequestId || materialRequestId < 1) return
    setLoading(true)
    try {
      const data = await fetchMaterialRequest(materialRequestId)
      setDetail(data)
    } catch (error) {
      setDetail(null)
      const message =
        error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.review.loadError
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [materialRequestId])

  useEffect(() => {
    void load()
  }, [load])

  const isCounterPending = detail?.status === "counter_proposed"

  async function acceptCounter(): Promise<boolean> {
    if (!materialRequestId) return false
    setAccepting(true)
    try {
      await acceptMaterialRequestCounter(materialRequestId)
      toast.success(MATERIAL_REQUEST_LABELS.review.acceptSuccess)
      await load()
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.review.acceptError
      toast.error(message)
      return false
    } finally {
      setAccepting(false)
    }
  }

  async function rejectCounter(): Promise<boolean> {
    if (!materialRequestId) return false
    setRejecting(true)
    try {
      await rejectMaterialRequestCounter(materialRequestId)
      toast.success(MATERIAL_REQUEST_LABELS.review.rejectSuccess)
      await load()
      return true
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : MATERIAL_REQUEST_LABELS.review.rejectError
      toast.error(message)
      return false
    } finally {
      setRejecting(false)
    }
  }

  return {
    detail,
    loading,
    isCounterPending,
    accepting,
    rejecting,
    acceptCounter,
    rejectCounter,
    reload: load,
  }
}
