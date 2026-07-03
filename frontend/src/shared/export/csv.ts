import { BRANDING } from "@/config/branding"

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

type CsvSummaryRow = {
  label: string
  value: string | number | null | undefined
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
  summary?: CsvSummaryRow[],
): void {
  const lines: string[] = [
    escapeCsvCell(BRANDING.legalName),
    escapeCsvCell(BRANDING.slogan),
    "",
  ]
  if (summary?.length) {
    lines.push(["Concepto", "Valor"].map(escapeCsvCell).join(","))
    for (const row of summary) {
      lines.push([row.label, row.value ?? ""].map(escapeCsvCell).join(","))
    }
    lines.push("")
  }
  lines.push(headers.map(escapeCsvCell).join(","))
  lines.push(...rows.map((row) => row.map(escapeCsvCell).join(",")))
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
