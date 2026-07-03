import {
  formatPackingListDate,
  PACKING_LIST_BRAND_LOGO,
  PACKING_LIST_COLORS,
  packingListAssetUrl,
  type PackingListPallet,
} from "@/features/dispatch/components/packingListLayout"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import { formatKgDisplay, parseKgNumber } from "@/shared/format/numbers"

export function DispatchPackingListPreview({ pallets }: { pallets: PackingListPallet[] }) {
  if (!pallets.length) return null
  const first = pallets[0]
  const totalKg = pallets.reduce((sum, p) => sum + parseKgNumber(p.total_kg), 0)
  const totalBob = pallets.reduce((sum, p) => sum + p.coils.length, 0)
  const rowCountFor = (coilCount: number) => Math.max(6, coilCount)
  const gridCols =
    pallets.length <= 1
      ? "grid-cols-1"
      : pallets.length === 2
        ? "sm:grid-cols-2"
        : pallets.length === 3
          ? "sm:grid-cols-2 lg:grid-cols-3"
          : "sm:grid-cols-2 lg:grid-cols-4"

  return (
    <div className="mx-auto w-full max-w-5xl rounded-lg border border-slate-300 bg-white p-4 text-[11px] text-slate-900 shadow-sm">
      <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-[10px] font-bold uppercase leading-tight tracking-wide">
          <div>PLÁSTICOS</div>
          <div>LA DINASTÍA</div>
          <div className="text-[9px] font-semibold text-slate-600">C.A.</div>
        </div>
        <img
          src={packingListAssetUrl(PACKING_LIST_BRAND_LOGO)}
          alt="Plásticos La Dinastía"
          className="mx-auto max-h-16 max-w-[220px] object-contain"
        />
        <div className="justify-self-end min-w-[130px] border border-slate-900 px-2 py-1 text-[10px] leading-relaxed">
          <div>
            <strong>FECHA:</strong> {formatPackingListDate(first.created_at)}
          </div>
          <div>
            <strong>TOTAL KG:</strong> {formatKgDisplay(totalKg)}
          </div>
          <div>
            <strong>TOTAL BOB:</strong> {totalBob}
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-center text-xl font-bold tracking-[0.08em]">LISTA DE EMPAQUE</h3>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 text-[11px]">
        <div>
          <strong>CLIENTE:</strong> {first.client_name ?? "—"}
        </div>
        <div>
          <strong>PRODUCTO:</strong> {first.product_name ?? "—"}
        </div>
        <div>
          <strong>MEDIDA:</strong> {first.measurements ?? "—"}
        </div>
      </div>

      <div className="mb-4 text-center text-3xl font-bold">{first.measurements ?? "—"}</div>

      <div className={`grid gap-3 ${gridCols}`}>
        {pallets.map((pallet) => (
          <div key={pallet.code} className="min-w-0">
            <p
              className="mb-1 border border-slate-900 py-1 text-center text-[10px] font-bold uppercase"
              style={{ backgroundColor: PACKING_LIST_COLORS.headerGreen }}
            >
              {formatPalletLabel(pallet)}
            </p>
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr style={{ backgroundColor: PACKING_LIST_COLORS.headerGreen }}>
                  <th className="border border-slate-900 px-1 py-1">Bob.</th>
                  <th className="border border-slate-900 px-1 py-1">Peso Neto</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: rowCountFor(pallet.coils.length) }, (_, index) => {
                  const coil = pallet.coils[index]
                  return (
                    <tr key={`${pallet.code}-row-${index}`}>
                      <td className="border border-slate-900 px-1 py-1 text-center">{index + 1}</td>
                      <td className="border border-slate-900 px-1 py-1 text-center tabular-nums">
                        {coil ? formatKgDisplay(coil.kg) : ""}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="font-bold" style={{ backgroundColor: PACKING_LIST_COLORS.totalYellow }}>
                  <td className="border border-slate-900 px-1 py-1 text-center">TOTAL KG</td>
                  <td className="border border-slate-900 px-1 py-1 text-center tabular-nums">
                    {formatKgDisplay(pallet.total_kg)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}
