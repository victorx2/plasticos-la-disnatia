import { useState } from "react"
import { AlertTriangle, Boxes, Info, Recycle } from "lucide-react"
import { Link } from "react-router-dom"

import { useFallasInventory } from "@/features/production-subproducts/hooks/useFallasInventory"
import { FALLAS_LABELS, SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import { inventoryClientLabel, inventoryOrderLabel } from "@/features/production-subproducts/lib/inventoryRowLabel"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function workOrderQuery(filterWorkOrderId: number | null) {
  return filterWorkOrderId ? `?work_order_id=${filterWorkOrderId}` : ""
}

export function FallasInventoryPage() {
  const {
    filterWorkOrderId,
    items,
    pendingShipments,
    loading,
    shippingKey,
    ship,
    acceptShipment,
    acceptingId,
  } = useFallasInventory()
  const [kgByKey, setKgByKey] = useState<Record<string, string>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})
  const query = workOrderQuery(filterWorkOrderId)

  return (
    <PageShell
      title={FALLAS_LABELS.title}
      subtitle={FALLAS_LABELS.subtitle}
      subtitleIcon={AlertTriangle}
      icon={AlertTriangle}
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/inventario-desperdicio${query}`}>
              <Recycle className="h-3.5 w-3.5" aria-hidden />
              {FALLAS_LABELS.linkDesperdicio}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/materiales">
              <Boxes className="h-3.5 w-3.5" aria-hidden />
              {FALLAS_LABELS.linkMateriales}
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mx-auto mb-4 max-w-5xl space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-950 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <p className="font-medium">{FALLAS_LABELS.helpFlow}</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p>{FALLAS_LABELS.extrusionNote}</p>
        </div>
      </div>

      {filterWorkOrderId ? (
        <p className="mx-auto mb-4 max-w-5xl rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs font-medium text-violet-800">
          {SUBPRODUCTS_LABELS.filteredWorkHint(filterWorkOrderId)}
        </p>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4 pb-6">
        <FormSectionCard title={FALLAS_LABELS.title}>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
              {FALLAS_LABELS.empty}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">OP</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">{FALLAS_LABELS.columns.extrusion}</th>
                    <th className="px-3 py-2">{FALLAS_LABELS.columns.returns}</th>
                    <th className="px-3 py-2">{FALLAS_LABELS.columns.sentMaterials}</th>
                    <th className="px-3 py-2">{SUBPRODUCTS_LABELS.columns.pending}</th>
                    <th className="px-3 py-2">Enviar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.item_key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">{inventoryOrderLabel(item)}</td>
                      <td className="px-3 py-2">{inventoryClientLabel(item) ?? item.client_name ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{formatKgDisplay(item.extrusion_kg)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatKgDisplay(item.returns_kg)}</td>
                      <td className="px-3 py-2 tabular-nums">{formatKgDisplay(item.sent_to_materials_kg)}</td>
                      <td className="px-3 py-2 tabular-nums font-medium text-amber-700">
                        {formatKgDisplay(item.pending_kg)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-[14rem] flex-col gap-1">
                          <Input
                            inputMode="decimal"
                            placeholder={SUBPRODUCTS_LABELS.placeholders.kg}
                            value={kgByKey[item.item_key] ?? ""}
                            onChange={(e) =>
                              setKgByKey((prev) => ({ ...prev, [item.item_key]: e.target.value }))
                            }
                          />
                          <Input
                            placeholder={SUBPRODUCTS_LABELS.placeholders.reason}
                            value={reasonByKey[item.item_key] ?? ""}
                            onChange={(e) =>
                              setReasonByKey((prev) => ({ ...prev, [item.item_key]: e.target.value }))
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={shippingKey === item.item_key}
                            onClick={() =>
                              void ship(
                                { key: item.item_key, workOrderId: item.work_order_id },
                                kgByKey[item.item_key] ?? "",
                                reasonByKey[item.item_key],
                              ).then((ok) => {
                                if (ok) {
                                  setKgByKey((prev) => ({ ...prev, [item.item_key]: "" }))
                                  setReasonByKey((prev) => ({ ...prev, [item.item_key]: "" }))
                                }
                              })
                            }
                          >
                            {shippingKey === item.item_key
                              ? SUBPRODUCTS_LABELS.shipping
                              : FALLAS_LABELS.shipToMaterials}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </FormSectionCard>

        <FormSectionCard title={FALLAS_LABELS.pendingMaterialsTitle}>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : pendingShipments.length === 0 ? (
            <p className="text-sm text-slate-500">{FALLAS_LABELS.pendingMaterialsEmpty}</p>
          ) : (
            <div className="space-y-2">
              {pendingShipments.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">#{row.id}</span>
                    {row.work_order_id ? (
                      <span className="text-slate-600"> · OP {row.work_order_id}</span>
                    ) : null}
                    <span className="ml-2 tabular-nums font-semibold text-amber-700">
                      {formatKgDisplay(row.kg)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={acceptingId === row.id}
                    onClick={() => void acceptShipment(row.id)}
                  >
                    {acceptingId === row.id ? FALLAS_LABELS.accepting : FALLAS_LABELS.accept}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </FormSectionCard>
      </div>
    </PageShell>
  )
}
