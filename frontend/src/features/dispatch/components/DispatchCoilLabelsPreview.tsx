import type { DispatchPalletCoil } from "@/features/dispatch/types"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
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

export type CoilLabelPreviewPallet = {
  code: string
  pallet_number?: number | null
  display_label?: string | null
  client_name?: string | null
  product_name?: string | null
  measurements?: string | null
  destination?: string | null
  created_at?: string | null
  coils: DispatchPalletCoil[]
}

function formatDate(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString("es-VE")
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("es-VE")
}

function CoilLabelCard({
  pallet,
  coil,
  index,
}: {
  pallet: CoilLabelPreviewPallet
  coil: DispatchPalletCoil
  index: number
}) {
  const kgDisplay = formatWeightDisplay(coil.kg)
  const shiftDisplay = formatShiftLabel(coil.shift)

  return (
    <div className="mx-auto w-full max-w-[220px] rounded-lg border border-slate-300 bg-white p-3 text-[10px] text-slate-900 shadow-sm">
      <div className="text-[9px] font-bold tracking-widest uppercase">PLÁSTICOS LA DINASTIA</div>
      <h4 className="my-1 text-center text-xs font-semibold tracking-widest">ETIQUETA DE BOBINA</h4>
      <div className="mb-2 text-center text-lg font-bold">{pallet.measurements ?? "—"}</div>
      <dl className="space-y-1">
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">CLIENTE</dt>
          <dd>{pallet.client_name ?? "—"}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">PRODUCTO</dt>
          <dd>{pallet.product_name ?? "—"}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">OP</dt>
          <dd>{coil.client_order_code ?? "—"}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">TP</dt>
          <dd>{coil.work_order_code ?? "—"}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">BOBINA</dt>
          <dd className="font-mono">{coil.coil_code}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">Nº</dt>
          <dd>
            {index + 1} de {pallet.coils.length}
          </dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">PALETA</dt>
          <dd>{formatPalletLabel(pallet)}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">TURNO</dt>
          <dd>{shiftDisplay}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">DESTINO</dt>
          <dd>{pallet.destination ?? "—"}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 border-b border-slate-200 py-0.5">
          <dt className="font-bold">PESO NETO</dt>
          <dd className="text-sm font-bold">{kgDisplay}</dd>
        </div>
        <div className="grid grid-cols-[56px_1fr] gap-1 py-0.5">
          <dt className="font-bold">FECHA</dt>
          <dd>{formatDate(pallet.created_at)}</dd>
        </div>
      </dl>
    </div>
  )
}

export function DispatchCoilLabelsPreview({ pallet }: { pallet: CoilLabelPreviewPallet }) {
  if (!pallet.coils.length) {
    return <p className="text-sm text-slate-500">Sin bobinas para previsualizar.</p>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pallet.coils.map((coil, index) => (
        <CoilLabelCard key={`${coil.coil_id}-${coil.coil_code}`} pallet={pallet} coil={coil} index={index} />
      ))}
    </div>
  )
}
