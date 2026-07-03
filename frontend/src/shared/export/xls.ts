import { buildExportBrandHtml } from "@/shared/export/brandHeader"
import { cellText } from "@/shared/export/types"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildSummaryTable(summary: Array<{ label: string; value: string }>): string {
  const rows = summary
    .map(
      (row) =>
        `<tr><th>${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`,
    )
    .join("")
  return `<table><tbody>${rows}</tbody></table>`
}

function buildDataTable(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")
  const body = rows
    .map((row) => {
      const cells = row.map((cell) => `<td>${escapeHtml(cellText(cell))}</td>`).join("")
      return `<tr>${cells}</tr>`
    })
    .join("")
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export function downloadXls(
  filename: string,
  title: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
  summary?: Array<{ label: string; value: string | number | null | undefined }>,
): void {
  const summaryRows =
    summary?.map((row) => ({ label: row.label, value: cellText(row.value) })) ?? []
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
<meta charset="UTF-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  table { border-collapse: collapse; margin-bottom: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 8px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; }
  h2 { font-family: Arial, sans-serif; font-size: 16px; margin: 0 0 12px; }
</style>
</head>
<body>
${buildExportBrandHtml()}
<h2>${escapeHtml(title)}</h2>
${summaryRows.length ? buildSummaryTable(summaryRows) : ""}
${buildDataTable(headers, rows)}
</body>
</html>`

  const blob = new Blob([`\uFEFF${html}`], {
    type: "application/vnd.ms-excel;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`
  link.click()
  URL.revokeObjectURL(url)
}
