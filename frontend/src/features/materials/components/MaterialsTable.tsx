import { Link } from "react-router-dom"
import { Pencil } from "lucide-react"

import { categoryLabel } from "@/features/materials/domain/categories"
import { formatKg } from "@/features/materials/domain/units"
import {
  materialBrand,
  materialProductType,
  materialUnitsCount,
} from "@/features/materials/domain/material-display"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import type { Material } from "@/features/materials/types"
import { catalogRowNumber } from "@/shared/catalog/classes"
import {
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"
import { Button } from "@/shared/ui/button"
import type { PaginatedResponse } from "@/shared/types/pagination"

const COL_SPAN = 9

type MaterialsTableProps = {
  rows: PaginatedResponse<Material> | null
}

export function materialsTableColSpan(): number {
  return COL_SPAN
}

export function MaterialsTable({ rows }: MaterialsTableProps) {
  if (!rows?.data.length) return null

  return (
    <CatalogTablePanel minWidth="1040px">
      <CatalogTableHeader>
        <CatalogTableHeadRow>
          <CatalogTableHead className="w-16">{MATERIAL_LABELS.table.number}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.productType}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.brand}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.category}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.stock}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.unitsCount}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.supplier}</CatalogTableHead>
          <CatalogTableHead>{MATERIAL_LABELS.fields.containerNumber}</CatalogTableHead>
          <CatalogTableHead align="right">{MATERIAL_LABELS.table.actions}</CatalogTableHead>
        </CatalogTableHeadRow>
      </CatalogTableHeader>

      <CatalogTableBody>
        {rows.data.map((material, index) => {
          const n = catalogRowNumber(rows.current_page, rows.per_page, index)

          return (
            <CatalogTableRow key={material.id}>
              <CatalogTableCell className="tabular-nums text-slate-500">{n}</CatalogTableCell>
              <CatalogTableCell className="font-mono text-xs font-medium text-slate-900">
                {materialProductType(material)}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[12rem] truncate font-medium">
                {materialBrand(material)}
              </CatalogTableCell>
              <CatalogTableCell>
                <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                  {categoryLabel(material.inventory_area)}
                </span>
              </CatalogTableCell>
              <CatalogTableCell className="tabular-nums font-medium">
                {formatKg(material.quantity_on_hand)}
              </CatalogTableCell>
              <CatalogTableCell className="tabular-nums text-slate-700">
                {materialUnitsCount(material)}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[10rem] truncate">
                {material.supplier?.name ?? "—"}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[8rem] truncate font-mono text-xs">
                {material.container_number?.trim() || "—"}
              </CatalogTableCell>
              <CatalogTableCell className="text-right">
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link to={`/materiales/form?id=${material.id}`}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {MATERIAL_LABELS.table.edit}
                  </Link>
                </Button>
              </CatalogTableCell>
            </CatalogTableRow>
          )
        })}
      </CatalogTableBody>
    </CatalogTablePanel>
  )
}
