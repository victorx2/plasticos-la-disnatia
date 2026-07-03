import { useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchSuppliers } from "@/features/masters/suppliers/api"
import type { Supplier } from "@/features/masters/suppliers/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { ApiError } from "@/shared/api/client"

const LOAD_ERROR = "No se pudieron cargar los proveedores."

export function useSupplierOptions() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const data = await fetchAllPages(fetchSuppliers, { active: 1 })
        if (!cancelled) setSuppliers(data)
      } catch (err) {
        if (!cancelled) {
          setSuppliers([])
          toast.error(err instanceof ApiError ? err.message : LOAD_ERROR)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { suppliers, loading }
}
