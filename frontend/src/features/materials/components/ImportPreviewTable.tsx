import { formatKg } from "@/features/materials/domain/units"
import type { ParsedImportRow } from "@/features/materials/domain/parse-csv"
import { MATERIAL_LABELS } from "@/features/materials/labels"
import {
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"

type ImportPreviewTableProps = {
  rows: ParsedImportRow[]
}

export function ImportPreviewTable({ rows }: ImportPreviewTableProps) {
  if (rows.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-600">
        {MATERIAL_LABELS.import.previewCount(rows.length)}
      </p>
      <CatalogTablePanel minWidth="960px">
        <CatalogTableHeader>
          <CatalogTableHeadRow>
            <CatalogTableHead className="w-14">#</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.category}</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.productType}</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.brand}</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.quantityKg}</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.unitsCount}</CatalogTableHead>
            <CatalogTableHead>{MATERIAL_LABELS.fields.containerNumber}</CatalogTableHead>
            <CatalogTableHead>Estado</CatalogTableHead>
          </CatalogTableHeadRow>
        </CatalogTableHeader>
        <CatalogTableBody>
          {rows.map((row) => (
            <CatalogTableRow key={row.row}>
              <CatalogTableCell className="tabular-nums text-slate-500">{row.row}</CatalogTableCell>
              <CatalogTableCell>{row.categoria || "—"}</CatalogTableCell>
              <CatalogTableCell className="font-mono text-xs">{row.tipo || "—"}</CatalogTableCell>
              <CatalogTableCell>{row.marca || "—"}</CatalogTableCell>
              <CatalogTableCell className="tabular-nums">
                {row.cantidadKg != null ? formatKg(row.cantidadKg) : "—"}
              </CatalogTableCell>
              <CatalogTableCell className="tabular-nums">
                {row.unidadesSacos != null
                  ? row.unidadesSacos.toLocaleString("es-VE", { maximumFractionDigits: 0 })
                  : "—"}
              </CatalogTableCell>
              <CatalogTableCell className="font-mono text-xs">
                {row.nroContenedor || "—"}
              </CatalogTableCell>
              <CatalogTableCell>
                {row.error ? (
                  <span className="text-xs font-medium text-amber-700">{row.error}</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-700">OK</span>
                )}
              </CatalogTableCell>
            </CatalogTableRow>
          ))}
        </CatalogTableBody>
      </CatalogTablePanel>
    </div>
  )
}
