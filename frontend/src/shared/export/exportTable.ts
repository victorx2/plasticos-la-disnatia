import { downloadCsv } from "@/shared/export/csv"
import { downloadPdfFromTable } from "@/shared/export/pdf"
import {
  reportExportFilename,
  type ExportFormat,
  type TableExportPayload,
} from "@/shared/export/types"
import { downloadXls } from "@/shared/export/xls"
export function downloadTableExport(format: ExportFormat, payload: TableExportPayload): void {
  const filename = reportExportFilename(payload.slug, format)
  const summary = payload.summary

  if (format === "csv") {
    downloadCsv(filename, payload.headers, payload.rows, summary)
    return
  }

  if (format === "xls") {
    downloadXls(filename, payload.title, payload.headers, payload.rows, summary)
    return
  }

  downloadPdfFromTable(filename, payload.title, payload.headers, payload.rows, summary)
}
