import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { ApiError } from "@/shared/api/client"
import { useDebouncedSearch } from "@/shared/hooks/useDebouncedSearch"
import type { PaginatedResponse } from "@/shared/types/pagination"

export type PaginatedQuery = {
  q?: string
  page?: number
  per_page?: number
}

type UsePaginatedListOptions<T> = {
  fetchPage: (query: PaginatedQuery) => Promise<PaginatedResponse<T>>
  loadErrorMessage: string
  defaultPerPage?: number
}

const DEFAULT_PER_PAGE = 20

export function usePaginatedList<T>({
  fetchPage,
  loadErrorMessage,
  defaultPerPage = DEFAULT_PER_PAGE,
}: UsePaginatedListOptions<T>) {
  const searchState = useDebouncedSearch()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(defaultPerPage)
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<PaginatedResponse<T> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPage({
        q: searchState.search || undefined,
        page,
        per_page: perPage,
      })
      setRows(data)
    } catch (error) {
      setRows(null)
      const message = error instanceof ApiError ? error.message : loadErrorMessage
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [fetchPage, loadErrorMessage, page, perPage, searchState.search])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [searchState.search])

  function applySearchNow() {
    searchState.applySearchNow()
    setPage(1)
  }

  return {
    query: searchState.query,
    setQuery: searchState.setQuery,
    search: searchState.search,
    page,
    setPage,
    perPage,
    setPerPage,
    loading,
    rows,
    reload: load,
    applySearchNow,
    hasActiveFilters: searchState.hasActiveFilters,
    showInitialSkeleton: loading && rows === null,
  }
}
