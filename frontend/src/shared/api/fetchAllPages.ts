import type { PaginatedResponse } from "@/shared/types/pagination"

/** Máximo `per_page` aceptado por el API Python en listados. */
export const API_MAX_PER_PAGE = 100

type PageQuery = {
  page?: number
  per_page?: number
}

export async function fetchAllPages<T, Q extends PageQuery>(
  fetchPage: (query: Q) => Promise<PaginatedResponse<T>>,
  baseQuery: Omit<Q, keyof PageQuery> = {} as Omit<Q, keyof PageQuery>,
): Promise<T[]> {
  const items: T[] = []
  let page = 1
  let lastPage = 1

  while (page <= lastPage) {
    const res = await fetchPage({
      ...baseQuery,
      page,
      per_page: API_MAX_PER_PAGE,
    } as Q)
    items.push(...res.data)
    lastPage = res.last_page
    page += 1
  }

  return items
}
