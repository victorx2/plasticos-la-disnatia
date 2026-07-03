import { useState } from "react"
import { Info, Package, Plus, Recycle, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { SubproductTable } from "@/features/production-subproducts/components/SubproductTable"
import {
  buildInventoryExport,
  SubproductExportBar,
} from "@/features/production-subproducts/components/SubproductExportBar"
import { useDesperdicioInventory } from "@/features/production-subproducts/hooks/useDesperdicioInventory"
import {
  desperdicioSourceDetail,
  inventoryClientLabel,
  inventoryOrderLabel,
} from "@/features/production-subproducts/lib/inventoryRowLabel"
import { DESPERDICIO_LABELS, SUBPRODUCTS_LABELS } from "@/features/production-subproducts/labels"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

function workOrderQuery(filterWorkOrderId: number | null) {
  return filterWorkOrderId ? `?work_order_id=${filterWorkOrderId}` : ""
}

export function DesperdicioInventoryPage() {
  const {
    filterWorkOrderId,
    items,
    loading,
    shippingKey,
    ship,
    entryDescription,
    setEntryDescription,
    entryWasteType,
    setEntryWasteType,
    entryKg,
    setEntryKg,
    entryNotes,
    setEntryNotes,
    entrySaving,
    registerEntry,
  } = useDesperdicioInventory()
  const [kgByKey, setKgByKey] = useState<Record<string, string>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})
  const query = workOrderQuery(filterWorkOrderId)
  const exportData = buildInventoryExport(items)

  return (
    <PageShell
      title={DESPERDICIO_LABELS.title}
      subtitle={DESPERDICIO_LABELS.subtitle}
      subtitleIcon={Recycle}
      icon={Recycle}
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/inventario-bolsones${query}`}>
              <Package className="h-3.5 w-3.5" aria-hidden />
              {DESPERDICIO_LABELS.linkBolsones}
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
      <div className="mx-auto mb-4 max-w-5xl space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50/70 px-4 py-3.5 text-sm text-rose-950 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700">
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <p className="font-medium">{DESPERDICIO_LABELS.helpFlow}</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-xs text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
          <p>{DESPERDICIO_LABELS.extrusionNote}</p>
        </div>
      </div>

      {filterWorkOrderId ? (
        <p className="mx-auto mb-4 max-w-5xl rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs font-medium text-violet-800">
          {SUBPRODUCTS_LABELS.filteredWorkHint(filterWorkOrderId)}
        </p>
      ) : null}

      <div className="mx-auto max-w-5xl space-y-4 pb-6">
        <FormSectionCard
          title={DESPERDICIO_LABELS.entryTitle}
          description={DESPERDICIO_LABELS.entryHint}
          action={
            <Button type="button" size="sm" disabled={entrySaving} onClick={() => void registerEntry()}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {entrySaving ? DESPERDICIO_LABELS.entrySaving : DESPERDICIO_LABELS.entrySave}
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <LabeledField htmlFor="desperdicio-entry-waste-type" label={DESPERDICIO_LABELS.entryWasteType}>
              <select
                id="desperdicio-entry-waste-type"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={entryWasteType}
                disabled={entrySaving}
                onChange={(e) => setEntryWasteType(e.target.value as "refil" | "transparente" | "")}
              >
                <option value="">{DESPERDICIO_LABELS.entryWasteTypePlaceholder}</option>
                <option value="refil">{DESPERDICIO_LABELS.entryWasteTypeRefil}</option>
                <option value="transparente">{DESPERDICIO_LABELS.entryWasteTypeTransparente}</option>
              </select>
            </LabeledField>
            <LabeledField htmlFor="desperdicio-entry-description" label={DESPERDICIO_LABELS.entryDescription}>
              <Input
                id="desperdicio-entry-description"
                placeholder={DESPERDICIO_LABELS.entryDescriptionPlaceholder}
                value={entryDescription}
                disabled={entrySaving}
                onChange={(e) => setEntryDescription(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="desperdicio-entry-kg" label={DESPERDICIO_LABELS.entryKg}>
              <Input
                id="desperdicio-entry-kg"
                inputMode="decimal"
                value={entryKg}
                disabled={entrySaving}
                onChange={(e) => setEntryKg(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="desperdicio-entry-notes" label={DESPERDICIO_LABELS.entryNotes}>
              <Input
                id="desperdicio-entry-notes"
                value={entryNotes}
                disabled={entrySaving}
                onChange={(e) => setEntryNotes(e.target.value)}
              />
            </LabeledField>
          </div>
        </FormSectionCard>

        <FormSectionCard title={DESPERDICIO_LABELS.title} description={SUBPRODUCTS_LABELS.shipSteps}>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
              {DESPERDICIO_LABELS.empty}
            </p>
          ) : (
            <>
              <SubproductExportBar
                title={DESPERDICIO_LABELS.title}
                slug="inventario-desperdicio"
                headers={exportData.headers}
                rows={exportData.rows}
              />
              <SubproductTable
                rows={items.map((item) => ({
                  key: item.item_key,
                  workOrderId: item.work_order_id,
                  manualEntryId: item.manual_entry_id,
                  order: inventoryOrderLabel(item),
                  client: inventoryClientLabel(item) ?? item.client_name,
                  detail: desperdicioSourceDetail(item),
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
