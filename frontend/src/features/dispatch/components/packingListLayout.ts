import { BRANDING, brandAssetUrl } from "@/config/branding"
import type { DispatchPalletCoil } from "@/features/dispatch/types"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

export type PackingListPallet = {
  code: string
  pallet_number?: number | null
  display_label?: string | null
  client_name?: string | null
  product_name?: string | null
  measurements?: string | null
  total_kg: string
  coils: DispatchPalletCoil[]
  created_at?: string | null
}

/** Colores del Excel «formato de bobinas». */
export const PACKING_LIST_COLORS = {
  headerGreen: "#c6e0b4",
  totalYellow: "#ffff00",
} as const

/** Logo central en lista de empaque (Plásticos La Dinastía). */
export const PACKING_LIST_BRAND_LOGO = BRANDING.logoFile

export function packingListAssetUrl(relativePath: string = BRANDING.logoFile): string {
  return brandAssetUrl(relativePath)
}

export function formatPackingListDate(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString("es-VE")
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-VE")
}

function palletTableHtml(pallet: PackingListPallet): string {
  const label = formatPalletLabel(pallet)
  const rowCount = Math.max(6, pallet.coils.length)
  const rows = Array.from({ length: rowCount }, (_, index) => {
    const coil = pallet.coils[index]
    return `<tr><td class="cell-num">${index + 1}</td><td class="cell-kg">${coil ? formatKgDisplay(coil.kg) : ""}</td></tr>`
  }).join("")

  return `
    <div class="pallet-col">
      <div class="pallet-title">${label}</div>
      <table>
        <thead><tr><th>Bob.</th><th>Peso Neto</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td>TOTAL KG</td><td class="cell-kg">${formatKgDisplay(pallet.total_kg)}</td></tr></tfoot>
      </table>
    </div>`
}

export function buildPackingListHtml(pallets: PackingListPallet[]): string {
  const first = pallets[0]
  const totalKg = pallets.reduce((sum, p) => sum + parseKgNumber(p.total_kg), 0)
  const totalBob = pallets.reduce((sum, p) => sum + p.coils.length, 0)
  const createdAt = first?.created_at ?? new Date().toISOString()
  const columns = pallets.map(palletTableHtml).join("")
  const brandLogo = packingListAssetUrl(PACKING_LIST_BRAND_LOGO)
  const { headerGreen, totalYellow } = PACKING_LIST_COLORS

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Lista de empaque v2</title>
  <style>
    @page { margin: 10mm; size: landscape; }
    body { font-family: Calibri, "Helvetica Neue", Arial, sans-serif; color: #111; margin: 0; padding: 12px; }
    .page { width: 100%; max-width: 1100px; margin: 0 auto; }
    .header { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-bottom: 8px; }
    .brand-dinastia { font-size: 11px; font-weight: 700; line-height: 1.25; text-transform: uppercase; letter-spacing: 0.04em; }
    .brand-dinastia-sub { font-size: 9px; font-weight: 600; color: #333; }
    .brand-logo { display: flex; justify-content: center; }
    .brand-logo img { max-height: 64px; max-width: 220px; object-fit: contain; }
    .meta-box { justify-self: end; border: 1px solid #111; padding: 6px 10px; font-size: 11px; line-height: 1.45; text-align: left; min-width: 130px; }
    .title { text-align: center; margin: 4px 0 10px; font-size: 22px; font-weight: 700; letter-spacing: 0.08em; }
    .info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 6px; font-size: 11px; }
    .measure { text-align: center; font-size: 36px; font-weight: 700; margin: 4px 0 12px; letter-spacing: 0.02em; }
    .pallets { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }
    .pallet-title { font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; text-align: center; background: ${headerGreen}; border: 1px solid #111; padding: 4px 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #111; padding: 4px 6px; font-size: 10px; }
    th { background: ${headerGreen}; font-weight: 700; text-align: center; }
    .cell-num { width: 32px; text-align: center; }
    .cell-kg { text-align: center; font-variant-numeric: tabular-nums; }
    tfoot td { font-weight: 700; background: ${totalYellow}; text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand-dinastia">
        <div>PLÁSTICOS</div>
        <div>LA DINASTÍA</div>
        <div class="brand-dinastia-sub">C.A.</div>
      </div>
      <div class="brand-logo">
        <img src="${brandLogo}" alt="Plásticos La Dinastía" />
      </div>
      <div class="meta-box">
        <div><strong>FECHA:</strong> ${formatPackingListDate(createdAt)}</div>
        <div><strong>TOTAL KG:</strong> ${formatKgDisplay(totalKg)}</div>
        <div><strong>TOTAL BOB:</strong> ${totalBob}</div>
      </div>
    </div>
    <h1 class="title">LISTA DE EMPAQUE</h1>
    <div class="info">
      <div><strong>CLIENTE:</strong> ${first?.client_name ?? "—"}</div>
      <div><strong>PRODUCTO:</strong> ${first?.product_name ?? "—"}</div>
      <div><strong>MEDIDA:</strong> ${first?.measurements ?? "—"}</div>
    </div>
    <div class="measure">${first?.measurements ?? "—"}</div>
    <div class="pallets">${columns}</div>
  </div>
</body>
</html>`
}
