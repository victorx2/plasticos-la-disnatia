import { Link } from "react-router-dom"

import { fetchMixtureProductionHistory } from "@/features/tinta-mixtures/production-api"
import { MIXING_LABELS } from "@/features/tinta-mixtures/labels"
import type { MixtureProductionHistoryEntry } from "@/features/tinta-mixtures/production-types"
import { formatKgDisplay } from "@/shared/format/numbers"
import { ApiError } from "@/shared/api/client"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Props = {
  workOrderId: number | null
}

export function MixtureProductionHistory({ workOrderId }: Props) {
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<MixtureProductionHistoryEntry[]>([])

  useEffect(() => {
    if (!workOrderId) {
      setEntries([])
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const data = await fetchMixtureProductionHistory(workOrderId)
        if (!cancelled) setEntries(data)
      } catch (error) {
        if (!cancelled) {
          setEntries([])
          const message = error instanceof ApiError ? error.message : MIXING_LABELS.loadRunsError
          toast.error(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workOrderId])

  if (!workOrderId) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{MIXING_LABELS.historyTitle}</h3>
      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-slate-500">{MIXING_LABELS.historyEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {entry.mixture_output_sku} · {entry.mixture_output_name}
                </span>
                <span className="text-xs rounded-full bg-violet-100 px-2 py-0.5 text-violet-800">
                  {entry.history_role === "destino_cruzado"
                    ? MIXING_LABELS.historyRoleDestino
                    : MIXING_LABELS.historyRoleOrigen}
                </span>
              </div>
              <p className="mt-1 text-slate-600">
                Trabajo: {entry.work_order_code ?? entry.work_order_id}
                {entry.used_in_work_order_code
                  ? ` → usada en ${entry.used_in_work_order_code}`
                  : null}
              </p>
              {entry.produced_kg ? (
                <p className="text-slate-600">
                  {MIXING_LABELS.historyProducedKg}: {formatKgDisplay(entry.produced_kg)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {entry.extrusion_run_id ? (
                  <Link className="text-violet-700 underline" to="/extrusion">
                    {MIXING_LABELS.historyExtrusion} #{entry.extrusion_run_id}
                  </Link>
                ) : null}
                {entry.inbound_material_request_id ? (
                  <Link
                    className="text-violet-700 underline"
                    to={`/solicitudes-area/insumos/${entry.inbound_material_request_id}`}
                  >
                    {MIXING_LABELS.historyInbound} #{entry.inbound_material_request_id}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
