import type { DispatchPalletCoil } from "@/features/dispatch/types"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import { BRANDING, brandAssetUrl } from "@/config/branding"
import { openPrintHtmlWithFallback } from "@/shared/print/openPrintHtml"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"
import { extrusionShiftLabel } from "@/features/production/extrusion/labels"

function formatShiftLabel(shift?: string | null): string {
  if (!shift?.trim()) return "—"
  return extrusionShiftLabel(shift.trim())
}

function formatWeightDisplay(kg?: string | null): string {
  const n = parseKgNumber(kg)
  return n > 0 ? formatKgDisplay(n) : "_____________ kg"
}

export type CoilLabelData = {
  coil_code: string
  coil_index: number
  coil_total: number
  client_name?: string | null
  product_name?: string | null
  measurements?: string | null
  destination?: string | null
  pallet_code: string
  pallet_number?: number | null
  display_label?: string | null
  work_order_code?: string | null
  client_order_code?: string | null
  shift?: string | null
  kg?: string | null
  created_at?: string | null
}

function formatDate(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString("es-VE")
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-VE")
}

function coilLabelHtml(label: CoilLabelData): string {
  const palletLabel = formatPalletLabel({
    code: label.pallet_code,
    pallet_number: label.pallet_number,
    display_label: label.display_label,
  })
  const kgDisplay = formatWeightDisplay(label.kg)

  return `
    <section class="label">
      <div class="brand-row">
        <img class="brand-logo" src="${brandAssetUrl()}" alt="${BRANDING.siteName}" />
        <div class="brand">${BRANDING.siteName.toUpperCase()}</div>
      </div>
      <h1 class="title">ETIQUETA DE BOBINA</h1>
      <div class="measure">${label.measurements ?? "—"}</div>
      <dl class="fields">
        <div class="row"><dt>CLIENTE</dt><dd>${label.client_name ?? "—"}</dd></div>
        <div class="row"><dt>PRODUCTO</dt><dd>${label.product_name ?? "—"}</dd></div>
        <div class="row"><dt>OP</dt><dd>${label.client_order_code ?? "—"}</dd></div>
        <div class="row"><dt>TP</dt><dd>${label.work_order_code ?? "—"}</dd></div>
        <div class="row"><dt>BOBINA</dt><dd>${label.coil_code}</dd></div>
        <div class="row"><dt>Nº</dt><dd>${label.coil_index} de ${label.coil_total}</dd></div>
        <div class="row"><dt>PALETA</dt><dd>${palletLabel}</dd></div>
        <div class="row"><dt>TURNO</dt><dd>${formatShiftLabel(label.shift)}</dd></div>
        <div class="row"><dt>DESTINO</dt><dd>${label.destination ?? "—"}</dd></div>
        <div class="row weight"><dt>PESO NETO</dt><dd>${kgDisplay}</dd></div>
        <div class="row"><dt>FECHA</dt><dd>${formatDate(label.created_at)}</dd></div>
      </dl>
    </section>`
}

const LABEL_STYLES = `
  @page { size: A4 portrait; margin: 8mm; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; color: #111; margin: 0; padding: 0; }
  .sheet {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
    align-content: start;
  }
  .label {
    box-sizing: border-box;
    border: 1px solid #bbb;
    padding: 4mm 3.5mm;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .brand-row { display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
  .brand-logo { max-height: 18px; max-width: 72px; object-fit: contain; }
  .brand { font-size: 7px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.2; }
  .title { text-align: center; font-size: 10px; letter-spacing: 0.12em; margin: 4px 0 2px; }
  .measure { text-align: center; font-size: 15px; font-weight: 700; margin: 3px 0 6px; }
  .fields { margin: 0; }
  .row { display: grid; grid-template-columns: 52px 1fr; gap: 4px; font-size: 8.5px; border-bottom: 1px solid #ddd; padding: 2px 0; }
  .row dt { font-weight: 700; margin: 0; }
  .row dd { margin: 0; word-break: break-word; }
  .row.weight dd { font-size: 11px; font-weight: 700; }
`

export function openCoilLabelPrint(label: CoilLabelData): void {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiqueta ${label.coil_code}</title>
  <style>${LABEL_STYLES}</style>
</head>
<body>
  <div class="sheet">${coilLabelHtml(label)}</div>
</body>
</html>`

  openPrintHtmlWithFallback(html, {
    title: `Etiqueta ${label.coil_code}`,
    filename: `etiqueta-${label.coil_code}.html`,
    autoPrint: true,
  })
}

export function openAllCoilLabelsPrint(pallet: {
  code: string
  pallet_number?: number | null
  display_label?: string | null
  client_name?: string | null
  product_name?: string | null
  measurements?: string | null
  destination?: string | null
  created_at?: string | null
  coils: DispatchPalletCoil[]
}): void {
  openBatchCoilLabelsPrint([pallet])
}

export function openBatchCoilLabelsPrint(
  pallets: Array<{
    code: string
    pallet_number?: number | null
    display_label?: string | null
    client_name?: string | null
    product_name?: string | null
    measurements?: string | null
    destination?: string | null
    created_at?: string | null
    coils: DispatchPalletCoil[]
  }>,
): void {
  const labels = pallets
    .flatMap((pallet) =>
      pallet.coils.map((coil, index) =>
        coilLabelHtml({
          coil_code: coil.coil_code,
          coil_index: index + 1,
          coil_total: pallet.coils.length,
          client_name: pallet.client_name,
          product_name: pallet.product_name,
          measurements: pallet.measurements,
          destination: pallet.destination,
          pallet_code: pallet.code,
          pallet_number: pallet.pallet_number,
          display_label: pallet.display_label,
          work_order_code: coil.work_order_code,
          client_order_code: coil.client_order_code,
          shift: coil.shift,
          kg: coil.kg,
          created_at: pallet.created_at,
        }),
      ),
    )
    .join("")

  if (!labels) return

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Etiquetas de bobinas</title>
  <style>${LABEL_STYLES}</style>
</head>
<body>
  <div class="sheet">${labels}</div>
</body>
</html>`

  openPrintHtmlWithFallback(html, {
    title: "Etiquetas de bobinas",
    filename: "etiquetas-bobinas.html",
    autoPrint: true,
  })
}
