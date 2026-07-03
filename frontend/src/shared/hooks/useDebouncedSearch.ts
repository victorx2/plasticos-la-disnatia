import { useEffect, useState } from "react"

const DEFAULT_DEBOUNCE_MS = 320

export function useDebouncedValue<T>(value: T, delayMs = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

/** Debounce de búsqueda con reset de página al cambiar el término. */
export function useDebouncedSearch(initial = "") {
  const [query, setQuery] = useState(initial)
  const [search, setSearch] = useState(initial)

  const debouncedQuery = useDebouncedValue(query.trim())

  useEffect(() => {
    setSearch(debouncedQuery)
  }, [debouncedQuery])

  function applySearchNow() {
    const next = query.trim()
    setSearch(next)
    return next
  }

  return {
    query,
    setQuery,
    search,
    setSearch,
    applySearchNow,
    hasActiveFilters: search.trim() !== "",
  }
}
