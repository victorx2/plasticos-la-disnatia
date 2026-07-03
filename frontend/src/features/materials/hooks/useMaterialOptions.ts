import { useEffect, useState } from "react"

import { fetchMaterials } from "@/features/materials/api"
import type { Material } from "@/features/materials/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"

export function useMaterialOptions(supplierId?: number | null) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const rows = await fetchAllPages(fetchMaterials, {})
        if (!cancelled) {
          setMaterials(
            supplierId && supplierId > 0
              ? rows.filter((m) => !m.supplier_id || m.supplier_id === supplierId)
              : rows,
          )
        }
      } catch {
        if (!cancelled) setMaterials([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supplierId])

  return { materials, loading }
}
