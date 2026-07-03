import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { fetchClients } from "@/features/masters/clients/api"
import type { Client } from "@/features/masters/clients/types"
import { fetchAllPages } from "@/shared/api/fetchAllPages"
import { ApiError } from "@/shared/api/client"

const LOAD_ERROR = "No se pudieron cargar los clientes."

export function useClientOptions() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllPages(fetchClients, {})
      setClients(data)
    } catch (err) {
      setClients([])
      const message = err instanceof ApiError ? err.message : LOAD_ERROR
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { clients, loading, error, reload }
}
