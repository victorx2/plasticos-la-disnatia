export type ExportFormat = "csv" | "xls" | "pdf"

export type ExportSummaryRow = {
  label: string
  value: string | number | null | undefined
}

export type TableExportPayload = {
  slug: string
  title: string
  headers: string[]
  rows: Array<Array<string | number | null | undefined>>
  summary?: ExportSummaryRow[]
}

export function reportExportFilename(slug: string, format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10)
  return `reporte-${slug}-${date}.${format}`
}

export function cellText(value: string | number | null | undefined): string {
  return value == null ? "" : String(value)
}
