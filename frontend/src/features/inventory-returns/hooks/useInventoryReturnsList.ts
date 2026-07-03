import { useCallback, useEffect, useState } from "react"

import {
  acceptInventoryReturn,
  fetchInventoryReturns,
  releaseInventoryReturnToMaterials,
} from "@/features/inventory-returns/api"
import { INVENTORY_RETURN_LABELS } from "@/features/inventory-returns/labels"
import type { ReturnKindTab } from "@/features/inventory-returns/types"
import { usePaginatedList } from "@/shared/hooks/usePaginatedList"
import { ApiError } from "@/shared/api/client"
import { toast } from "sonner"

export function useInventoryReturnsList() {
  const [kindTab, setKindTab] = useState<ReturnKindTab>("all")
  const [acceptingId, setAcceptingId] = useState<number | null>(null)
  const [releasingId, setReleasingId] = useState<number | null>(null)

  const fetchPage = useCallback(
    (query: { q?: string; page?: number; per_page?: number }) => {
      const destination_area =
        kindTab === "good"
          ? "material"
          : kindTab === "rejected"
            ? "bobinas_rechazadas"
            : kindTab === "fallas"
              ? "fallas"
              : undefined
      const destination_areas = kindTab === "tintas" ? "tintas,cementerio_tintas" : undefined

      return fetchInventoryReturns({
        ...query,
        destination_area,
        destination_areas,
      })
    },
    [kindTab],
  )

  const { setPage, ...list } = usePaginatedList({
    fetchPage,
    loadErrorMessage: INVENTORY_RETURN_LABELS.loadError,
  })

  useEffect(() => {
    setPage(1)
  }, [kindTab, setPage])

  async function acceptReturn(id: number): Promise<void> {
    setAcceptingId(id)
    try {
      await acceptInventoryReturn(id, INVENTORY_RETURN_LABELS.defaultAcceptReason)
      toast.success(INVENTORY_RETURN_LABELS.acceptSuccess)
      await list.reload()
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : INVENTORY_RETURN_LABELS.acceptError
      toast.error(message)
    } finally {
      setAcceptingId(null)
    }
  }

  async function releaseToMaterials(id: number): Promise<void> {
    setReleasingId(id)
    try {
      await releaseInventoryReturnToMaterials(
        id,
        INVENTORY_RETURN_LABELS.defaultAcceptReason,
      )
      toast.success(INVENTORY_RETURN_LABELS.releaseToMaterialsSuccess)
      await list.reload()
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : INVENTORY_RETURN_LABELS.releaseToMaterialsError
      toast.error(message)
    } finally {
      setReleasingId(null)
    }
  }

  return {
    ...list,
    setPage,
    kindTab,
    setKindTab,
    acceptingId,
    acceptReturn,
    releasingId,
    releaseToMaterials,
  }
}
