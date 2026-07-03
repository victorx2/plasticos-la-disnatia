/** Clases reutilizables para listados maestros / catálogos. */
export const catalogPanelClass =
  "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"

export const catalogFilterPanelClass =
  "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"

export const catalogTableClass = "w-full text-left text-sm"

export const catalogTableHeadRowClass =
  "border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500"

export const catalogTableHeadCellClass = "px-4 py-3 font-medium"

export const catalogTableBodyRowClass = "border-t border-slate-100 hover:bg-slate-50/60"

export const catalogTableBodyCellClass = "px-4 py-3"

export const catalogPaginationBarClass =
  "flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"

export function catalogRowNumber(
  currentPage: number,
  perPage: number,
  index: number,
): number {
  return (currentPage - 1) * perPage + index + 1
}
