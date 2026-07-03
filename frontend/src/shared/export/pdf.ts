import { BRANDING } from "@/config/branding"
import { cellText } from "@/shared/export/types"

type PdfLine = {
  text: string
  x: number
  y: number
  size?: number
  bold?: boolean
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`
}

function buildPdfDocument(lines: PdfLine[], pageWidth = 842, pageHeight = 595): string {
  const contentLines = ["BT"]
  for (const line of lines) {
    const font = line.bold ? "/F2" : "/F1"
    const size = line.size ?? 10
    contentLines.push(`${font} ${size} Tf`)
    contentLines.push(`1 0 0 1 ${line.x.toFixed(2)} ${line.y.toFixed(2)} Tm`)
    contentLines.push(`(${escapePdfText(line.text)}) Tj`)
  }
  contentLines.push("ET")
  const stream = `${contentLines.join("\n")}\n`

  const objects = [
    "",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets: number[] = [0]

  for (let index = 1; index < objects.length; index += 1) {
    offsets.push(pdf.length)
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length}\n`
  pdf += "0000000000 65535 f \n"
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return pdf
}

export function downloadPdfFromTable(
  filename: string,
  title: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
  summary?: Array<{ label: string; value: string | number | null | undefined }>,
): void {
  const landscapeWidth = 842
  const landscapeHeight = 595
  const marginX = 36
  const topY = landscapeHeight - 36
  const lineHeight = 14
  const columnCount = Math.max(headers.length, 1)
  const columnWidth = (landscapeWidth - marginX * 2) / columnCount
  const maxChars = Math.max(8, Math.floor(columnWidth / 5.5))

  const lines: PdfLine[] = [
    { text: BRANDING.legalName, x: marginX, y: topY, size: 12, bold: true },
    { text: BRANDING.slogan, x: marginX, y: topY - 14, size: 9 },
    { text: title, x: marginX, y: topY - 32, size: 14, bold: true },
  ]
  let y = topY - 56

  if (summary?.length) {
    for (const row of summary) {
      lines.push({
        text: `${row.label}: ${cellText(row.value)}`,
        x: marginX,
        y,
        size: 10,
        bold: true,
      })
      y -= lineHeight
    }
    y -= 6
  }

  headers.forEach((header, index) => {
    lines.push({
      text: truncate(header, maxChars),
      x: marginX + index * columnWidth,
      y,
      size: 9,
      bold: true,
    })
  })
  y -= lineHeight

  for (const row of rows) {
    if (y < 36) break
    row.forEach((cell, index) => {
      lines.push({
        text: truncate(cellText(cell), maxChars),
        x: marginX + index * columnWidth,
        y,
        size: 9,
      })
    })
    y -= lineHeight
  }

  const pdfContent = buildPdfDocument(lines, landscapeWidth, landscapeHeight)
  const blob = new Blob([pdfContent], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
