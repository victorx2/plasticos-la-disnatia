import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react"

import {
  catalogPanelClass,
  catalogTableBodyCellClass,
  catalogTableBodyRowClass,
  catalogTableClass,
  catalogTableHeadCellClass,
  catalogTableHeadRowClass,
} from "@/shared/catalog/classes"
import { CATALOG_LABELS } from "@/shared/catalog/labels"
import { cn } from "@/shared/lib/utils"

type CatalogTablePanelProps = HTMLAttributes<HTMLDivElement> & {
  minWidth?: string
}

export function CatalogTablePanel({
  className,
  minWidth = "640px",
  children,
  ...props
}: CatalogTablePanelProps) {
  return (
    <div className={cn(catalogPanelClass, className)} {...props}>
      <div className="overflow-x-auto">
        <table className={catalogTableClass} style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  )
}

export function CatalogTableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("sticky top-0 z-10", className)} {...props} />
}

export function CatalogTableHeadRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn(catalogTableHeadRowClass, className)} {...props} />
}

export function CatalogTableHead({
  className,
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" }) {
  return (
    <th
      className={cn(
        catalogTableHeadCellClass,
        align === "right" && "text-right",
        className,
      )}
      {...props}
    />
  )
}

export function CatalogTableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />
}

export function CatalogTableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn(catalogTableBodyRowClass, className)} {...props} />
}

export function CatalogTableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn(catalogTableBodyCellClass, className)} {...props} />
}

type CatalogLoadingRowsProps = {
  colSpan: number
  label?: string
}

export function CatalogLoadingRows({ colSpan, label = CATALOG_LABELS.loading }: CatalogLoadingRowsProps) {
  return (
    <CatalogTableRow className="hover:bg-transparent">
      <CatalogTableCell colSpan={colSpan} className="py-10 text-center text-slate-500">
        {label}
      </CatalogTableCell>
    </CatalogTableRow>
  )
}

type CatalogEmptyRowsProps = {
  colSpan: number
  children: ReactNode
}

export function CatalogEmptyRows({ colSpan, children }: CatalogEmptyRowsProps) {
  return (
    <CatalogTableRow className="hover:bg-transparent">
      <CatalogTableCell colSpan={colSpan} className="p-0">
        {children}
      </CatalogTableCell>
    </CatalogTableRow>
  )
}
