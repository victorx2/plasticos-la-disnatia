import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { fetchNrocOrderHistory } from "@/features/nroc-orders/api"
import { PRODUCTION_ORDER_LABELS } from "@/features/nroc-orders/labels"
import type { NrocOrderHistory } from "@/features/nroc-orders/types"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"

type ProductionOrderHistoryDialogProps = {
  orderId: number | null
  orderCode?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductionOrderHistoryDialog({
  orderId,
  orderCode,
  open,
  onOpenChange,
}: ProductionOrderHistoryDialogProps) {
  const [history, setHistory] = useState<NrocOrderHistory | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !orderId) {
      setHistory(null)
      return
    }
    setLoading(true)
    void fetchNrocOrderHistory(orderId)
      .then(setHistory)
      .catch(() => setHistory(null))
      .finally(() => setLoading(false))
  }, [open, orderId])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <h2 className="text-base font-semibold text-slate-900">
          {PRODUCTION_ORDER_LABELS.historyTitle(orderCode ?? orderId ?? "")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{PRODUCTION_ORDER_LABELS.historySubtitle}</p>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando registro…
          </div>
        ) : !history ? (
          <p className="py-6 text-sm text-slate-500">{PRODUCTION_ORDER_LABELS.historyEmpty}</p>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            <section className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <p className="font-semibold text-slate-900">{history.order.client_name ?? "—"}</p>
              <p className="mt-1 text-slate-600">
                Estado: <span className="font-medium">{history.order.status}</span>
              </p>
              {history.timeline.duration_hours ? (
                <p className="mt-1 text-slate-600">
                  Duración aprox.: {history.timeline.duration_hours} h
                </p>
              ) : null}
              <ul className="mt-2 space-y-1 text-slate-600">
                {history.order.lines.map((line, index) => (
                  <li key={index}>
                    Solicitado: {line.product_name ?? "—"} · {formatKgDisplay(line.quantity)}{" "}
                    {line.unit ?? "kg"}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 font-semibold text-slate-900">{PRODUCTION_ORDER_LABELS.historyRequests}</h3>
              {history.material_requests.length === 0 ? (
                <p className="text-slate-500">Sin solicitudes registradas.</p>
              ) : (
                <ul className="space-y-2">
                  {history.material_requests.map((req) => (
                    <li key={req.id} className="rounded-md border border-slate-200 px-3 py-2">
                      <p>
                        Solicitud #{req.id} · {req.flow === "inbound" ? "Entrada almacén" : "Salida almacén"} ·{" "}
                        {req.status}
                      </p>
                      <p className="text-xs text-slate-500">
                        Autorizado {formatKgDisplay(req.kg_authorized)} · Despachado{" "}
                        {formatKgDisplay(req.kg_dispatched)} · Pendiente {formatKgDisplay(req.kg_remaining)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold text-slate-900">{PRODUCTION_ORDER_LABELS.historyProduction}</h3>
              {history.extrusion_runs.length === 0 ? (
                <p className="text-slate-500">Sin extrusión registrada.</p>
              ) : (
                <ul className="space-y-2">
                  {history.extrusion_runs.map((run) => (
                    <li key={run.id} className="rounded-md border border-slate-200 px-3 py-2">
                      <p>
                        Sesión #{run.id} · {run.status} · {run.coils_count} bobinas ·{" "}
                        {formatKgDisplay(run.total_kg)}
                      </p>
                      <ul className="mt-1 text-xs text-slate-500">
                        {run.segments.map((seg, index) => (
                          <li key={index}>
                            {seg.shift ?? "—"} / {seg.machine ?? "—"} · {formatKgDisplay(seg.total_kg)} ·{" "}
                            {seg.coils_count} bob. · bolsones {formatKgDisplay(seg.bolsones_kg)}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-violet-200 bg-violet-50/40 p-4">
              <h3 className="font-semibold text-slate-900">{PRODUCTION_ORDER_LABELS.historyDispatch}</h3>
              <p className="mt-1 text-slate-700">
                Bobinas despachadas: {history.dispatch_summary.coils_dispatched} · Pendientes:{" "}
                {history.dispatch_summary.coils_pending}
              </p>
            </section>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
