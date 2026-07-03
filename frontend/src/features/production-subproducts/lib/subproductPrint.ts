import { PACKING_LIST_BRAND_LOGO, packingListAssetUrl } from "@/features/dispatch/components/packingListLayout"
import { openPrintHtmlWithFallback } from "@/shared/print/openPrintHtml"

export type SubproductPrintRow = {
  cells: string[]
}

export function buildSubproductTableHtml(title: string, headers: string[], rows: SubproductPrintRow[]): string {
  const logoUrl = packingListAssetUrl(PACKING_LIST_BRAND_LOGO)
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")
  const body = rows
    .map((row) => {
      const tds = row.cells
        .map((c, i) => {
          const cls = i >= 2 ? ' class="num"' : ""
          return `<td${cls}>${escapeHtml(c)}</td>`
        })
        .join("")
      return `<tr>${tds}</tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #0f172a; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    p.meta { font-size: 12px; color: #64748b; margin: 0 0 16px; }
    img.logo { height: 48px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <img class="logo" src="${logoUrl}" alt="Plásticos La Dinastía" />
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">Generado ${escapeHtml(new Date().toLocaleString("es-VE"))}</p>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body || `<tr><td colspan="${headers.length}">Sin registros</td></tr>`}</tbody>
  </table>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function openSubproductPrint(title: string, headers: string[], rows: SubproductPrintRow[]): void {
  const html = buildSubproductTableHtml(title, headers, rows)
  openPrintHtmlWithFallback(html, {
    title,
    filename: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.html`,
    autoPrint: true,
  })
}
