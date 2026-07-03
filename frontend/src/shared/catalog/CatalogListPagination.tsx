import { ChevronLeft, ChevronRight } from "lucide-react"

import { catalogPaginationBarClass } from "@/shared/catalog/classes"
import { CATALOG_LABELS } from "@/shared/catalog/labels"
import type { PaginatedResponse } from "@/shared/types/pagination"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const

type CatalogListPaginationProps = {
  rows: PaginatedResponse<unknown> | null
  loading: boolean
  perPage: number
  onPerPageChange: (value: number) => void
  onPageChange: (page: number) => void
  perPageOptions?: readonly number[]
  selectId?: string
}

function PaginationSummary({ rows }: { rows: PaginatedResponse<unknown> }) {
  const from = rows.from ?? 0
  const to = rows.to ?? 0
  const total = rows.total

  if (rows.last_page > 1) {
    return (
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-slate-600">
          {CATALOG_LABELS.showingRange(from, to, total)}
        </p>
        <p className="text-xs text-slate-500">
          {CATALOG_LABELS.pageOf(rows.current_page, rows.last_page)}
        </p>
      </div>
    )
  }

  return (
    <p className="min-w-0 text-sm text-slate-600">
      {CATALOG_LABELS.showingRangeBold(from, to, total)}
    </p>
  )
}

export function CatalogListPagination({
  rows,
  loading,
  perPage,
  onPerPageChange,
  onPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  selectId = "catalog-per-page",
}: CatalogListPaginationProps) {
  if (!rows || rows.total === 0) return null

  const showPageNav = rows.last_page > 1

  return (
    <div className={catalogPaginationBarClass}>
      <PaginationSummary rows={rows} />

      <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="text-xs text-slate-500 sm:text-sm">
            {CATALOG_LABELS.perPage}
          </label>
          <select
            id={selectId}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
            value={perPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value))
              onPageChange(1)
            }}
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {showPageNav ? (
          <>
            <span
              className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium tabular-nums text-slate-600"
              aria-live="polite"
            >
              {CATALOG_LABELS.pageSlash(rows.current_page, rows.last_page)}
            </span>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-8 gap-1 px-2.5")}
                disabled={rows.current_page <= 1 || loading}
                onClick={() => onPageChange(Math.max(1, rows.current_page - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {CATALOG_LABELS.previous}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-8 gap-1 px-2.5")}
                disabled={rows.current_page >= rows.last_page || loading}
                onClick={() => onPageChange(rows.current_page + 1)}
              >
                {CATALOG_LABELS.next}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
