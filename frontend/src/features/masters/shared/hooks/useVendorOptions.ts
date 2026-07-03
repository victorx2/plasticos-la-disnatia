import { useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchVendors } from "@/features/masters/vendors/api"
import type { Vendor } from "@/features/masters/vendors/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { ApiError } from "@/shared/api/client"

const LOAD_ERROR = "No se pudieron cargar los vendedores."

export function useVendorOptions() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const data = await fetchAllPages(fetchVendors, { active: 1 })
        if (!cancelled) setVendors(data)
      } catch (err) {
        if (!cancelled) {
          setVendors([])
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

  return { vendors, loading }
}
