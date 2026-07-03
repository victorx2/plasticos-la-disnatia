import type { ReactNode } from "react"
import { Search, X } from "lucide-react"

import { Input } from "@/shared/ui/input"

import "./CatalogDataTable.css"

type CatalogListPanelShellProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearchSubmit: () => void
  searchPlaceholder: string
  searchAriaLabel: string
  searchId: string
  hasActiveFilters?: boolean
  showSearch?: boolean
  filters?: ReactNode
  tabs?: ReactNode
  minTableWidth?: string
  showPagination?: boolean
  pagination?: ReactNode
  children: ReactNode
}

export function CatalogListPanelShell({
  query,
  onQueryChange,
  onSearchSubmit,
  searchPlaceholder,
  searchAriaLabel,
  searchId,
  hasActiveFilters = false,
  showSearch = true,
  filters,
  tabs,
  minTableWidth = "880px",
  showPagination = false,
  pagination,
  children,
}: CatalogListPanelShellProps) {
  const showClearSearch = query.trim().length > 0

  return (
    <div className="space-y-4">
      {tabs}

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
        {(showSearch || filters || hasActiveFilters) ? (
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
              {hasActiveFilters ? (
                <span className="text-xs font-medium text-violet-700">Resultados filtrados</span>
              ) : null}
              {filters}
            </div>

            {showSearch ? (
            <div className="relative w-full lg:max-w-sm lg:shrink-0">
              <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 shadow-sm transition-shadow focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-500/20">
                <span
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-violet-50 p-1.5"
                  aria-hidden
                >
                  <Search className="h-3.5 w-3.5 text-violet-600" />
                </span>
                <Input
                  id={searchId}
                  className="h-8 flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  placeholder={searchPlaceholder}
                  aria-label={searchAriaLabel}
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSearchSubmit()
                  }}
                />
                {showClearSearch ? (
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Limpiar búsqueda"
                    onClick={() => onQueryChange("")}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
            ) : null}
          </div>
        </div>
        ) : null}

        <div className="catalog-data-table relative min-h-[300px] overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: minTableWidth }}>
            {children}
          </table>
        </div>

        {showPagination && pagination ? (
          <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3">{pagination}</div>
        ) : null}
      </section>
    </div>
  )
}

export const catalogTableRowClass = "catalog-table-row group"
export const catalogTableCellClass = "catalog-table-cell"
