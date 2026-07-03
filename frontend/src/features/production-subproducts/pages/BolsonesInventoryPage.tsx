import { useState } from "react"
import { Info, Package, Plus, Recycle, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { SubproductTable } from "@/features/production-subproducts/components/SubproductTable"
import {
  buildInventoryExport,
  SubproductExportBar,
} from "@/features/production-subproducts/components/SubproductExportBar"
import { useBolsonesInventory } from "@/features/production-subproducts/hooks/useBolsonesInventory"
import { inventoryClientLabel, inventoryOrderLabel } from "@/features/production-subproducts/lib/inventoryRowLabel"
import { BOLSONES_LABELS, SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function workOrderQuery(filterWorkOrderId: number | null) {
  return filterWorkOrderId ? `?work_order_id=${filterWorkOrderId}` : ""
}

export function BolsonesInventoryPage() {
  const {
    filterWorkOrderId,
    items,
    loading,
    shippingKey,
    ship,
    entryMeasure,
    setEntryMeasure,
    entryKg,
    setEntryKg,
    entryNotes,
    setEntryNotes,
    entrySaving,
    registerEntry,
  } = useBolsonesInventory()
  const [kgByKey, setKgByKey] = useState<Record<string, string>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})
  const query = workOrderQuery(filterWorkOrderId)
  const exportData = buildInventoryExport(items, { stockByMeasure: true })

  return (
    <PageShell
      title={BOLSONES_LABELS.title}
      subtitle={BOLSONES_LABELS.subtitle}
      subtitleIcon={Package}
      icon={Package}
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/inventario-desperdicio${query}`}>
              <Recycle className="h-3.5 w-3.5" aria-hidden />
              {BOLSONES_LABELS.linkDesperdicio}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/despacho${query}`}>
              <Truck className="h-3.5 w-3.5" aria-hidden />
              {SUBPRODUCTS_LABELS.goToDispatch}
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mx-auto mb-4 flex max-w-5xl items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3.5 text-sm text-amber-950 shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <p className="font-medium">{BOLSONES_LABELS.helpFlow}</p>
      </div>

      {filterWorkOrderId ? (
        <p className="mx-auto mb-4 max-w-5xl rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs font-medium text-violet-800">
          {SUBPRODUCTS_LABELS.filteredWorkHint(filterWorkOrderId)}
        </p>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4 pb-6">
        <FormSectionCard
          title={BOLSONES_LABELS.entryTitle}
          description={BOLSONES_LABELS.entryHint}
          action={
            <Button type="button" size="sm" disabled={entrySaving} onClick={() => void registerEntry()}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {entrySaving ? BOLSONES_LABELS.entrySaving : BOLSONES_LABELS.entrySave}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <LabeledField htmlFor="bolsones-entry-measure" label={BOLSONES_LABELS.entryMeasure}>
              <Input
                id="bolsones-entry-measure"
                placeholder={BOLSONES_LABELS.entryMeasurePlaceholder}
                value={entryMeasure}
                disabled={entrySaving}
                onChange={(e) => setEntryMeasure(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="bolsones-entry-kg" label={BOLSONES_LABELS.entryKg}>
              <Input
                id="bolsones-entry-kg"
                inputMode="decimal"
                value={entryKg}
                disabled={entrySaving}
                onChange={(e) => setEntryKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="bolsones-entry-notes" label={BOLSONES_LABELS.entryNotes}>
              <Input
                id="bolsones-entry-notes"
                value={entryNotes}
                disabled={entrySaving}
                onChange={(e) => setEntryNotes(e.target.value)}
              />
            </LabeledField>
          </div>
        </FormSectionCard>

        <FormSectionCard title={BOLSONES_LABELS.title} description={SUBPRODUCTS_LABELS.shipSteps}>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
              {BOLSONES_LABELS.empty}
            </p>
          ) : (
            <>
              <SubproductExportBar
                title={BOLSONES_LABELS.title}
                slug="inventario-bolsones"
                headers={exportData.headers}
                rows={exportData.rows}
              />
              <SubproductTable
                stockByMeasure
                rows={items.map((item) => ({
                  key: item.item_key,
                  measure: item.measure,
                  order: inventoryOrderLabel(item),
                  client: inventoryClientLabel(item),
                  detail: null,
                  produced: item.produced_kg,
                  dispatched: item.dispatched_kg,
                  pending: item.pending_kg,
                }))}
                kgByKey={kgByKey}
                reasonByKey={reasonByKey}
                shippingKey={shippingKey}
                onKgChange={(key, value) => setKgByKey((prev) => ({ ...prev, [key]: value }))}
                onReasonChange={(key, value) => setReasonByKey((prev) => ({ ...prev, [key]: value }))}
                onShip={(row) =>
                  void ship(row, kgByKey[row.key] ?? "", reasonByKey[row.key]).then((ok) => {
                    if (ok) {
                      setKgByKey((prev) => ({ ...prev, [row.key]: "" }))
                      setReasonByKey((prev) => ({ ...prev, [row.key]: "" }))
                    }
                  })
                }
              />
            </>
          )}
        </FormSectionCard>
      </div>
    </PageShell>
  )
}
