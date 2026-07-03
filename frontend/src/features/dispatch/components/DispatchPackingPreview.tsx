import type { DispatchPalletCoil } from "@/features/dispatch/types"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import { formatKgDisplay } from "@/shared/format/numbers"

export type PackingPreviewPallet = {
  code: string
  pallet_number?: number | null
  display_label?: string | null
  client_name?: string | null
  destination?: string | null
  product_name?: string | null
  measurements?: string | null
  total_kg: string
  coils: DispatchPalletCoil[]
  created_at?: string | null
}

function formatDate(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString("es-VE")
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-VE")
}

export function DispatchPackingPreview({ pallet }: { pallet: PackingPreviewPallet }) {
  const rowCount = Math.max(6, pallet.coils.length)

  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg border border-slate-300 bg-white p-4 text-[11px] text-slate-900 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="text-base font-bold tracking-widest uppercase">PLÁSTICOS LA DINASTIA</div>
        <div className="min-w-[150px] border border-slate-900 px-2 py-1 text-right text-[10px] leading-relaxed">
          <div>
            <strong>FECHA:</strong> {formatDate(pallet.created_at)}
          </div>
          <div>
            <strong>TOTAL KG:</strong> {formatKgDisplay(pallet.total_kg)}
          </div>
          <div>
            <strong>TOTAL BOB:</strong> {pallet.coils.length}
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-center text-lg font-semibold tracking-[0.12em]">RESUMEN DE PACKING</h3>

      <div className="mb-3 grid gap-2 sm:grid-cols-2 text-[11px]">
        <div>
          <strong>CLIENTE:</strong> {pallet.client_name ?? "—"}
        </div>
        <div>
          <strong>PRODUCTO:</strong> {pallet.product_name ?? "—"}
        </div>
        <div>
          <strong>MEDIDA:</strong> {pallet.measurements ?? "—"}
        </div>
        <div>
          <strong>PALETA Nº:</strong> {formatPalletLabel(pallet).replace(/^PALETA\s*/i, "")}
        </div>
      </div>

      <div className="mb-3 text-center text-2xl font-bold">{pallet.measurements ?? "—"}</div>
      <p className="mb-2 text-xs font-bold uppercase">{formatPalletLabel(pallet)}</p>

      <table className="mb-3 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-900 px-2 py-1.5">Bob.</th>
            <th className="border border-slate-900 px-2 py-1.5 text-right">Peso Neto</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }, (_, index) => {
            const coil = pallet.coils[index]
            return (
              <tr key={index}>
                <td className="border border-slate-900 px-2 py-1.5 text-center">{index + 1}</td>
                <td className="border border-slate-900 px-2 py-1.5 text-right tabular-nums">
                  {coil ? formatKgDisplay(coil.kg) : ""}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 font-bold">
            <td className="border border-slate-900 px-2 py-1.5">Total kg</td>
            <td className="border border-slate-900 px-2 py-1.5 text-right tabular-nums">
              {formatKgDisplay(pallet.total_kg)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
