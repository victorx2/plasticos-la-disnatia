import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Eye,
  Info,
  MapPin,
  MessageSquareText,
  Package,
  Plus,
  Printer,
  Recycle,
  Ruler,
  Scale,
  Tag,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import { fetchDispatchPallet } from "@/features/dispatch/api"
import { DispatchCoilLabelsPreview } from "@/features/dispatch/components/DispatchCoilLabelsPreview"
import { openAllCoilLabelsPrint } from "@/features/dispatch/components/DispatchCoilLabelPrint"
import {
  DispatchOutboundRegistry,
} from "@/features/dispatch/components/DispatchOutboundRegistry"
import { DispatchPackingListPreview } from "@/features/dispatch/components/DispatchPackingListPreview"
import { openPackingListPrint } from "@/features/dispatch/components/DispatchPackingListPrint"
import { openPackingPrint } from "@/features/dispatch/components/DispatchPackingPrint"
import { draftPalletLabel, formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import type { PalletDraft } from "@/features/dispatch/hooks/useDispatchWizard"
import { DISPATCH_LABELS } from "@/features/dispatch/labels"
import { extrusionShiftLabel } from "@/features/production/extrusion/labels"
import { EXTRUSION_SHIFTS } from "@/features/production/extrusion/types"
import { bobinasInventoryTotals } from "@/features/dispatch/lib/groupBobinasByOrder"
import { DispatchSubproductsSection } from "@/features/dispatch/components/DispatchSubproductsSection"
import { useDispatchWizard } from "@/features/dispatch/hooks/useDispatchWizard"
import type { BobinaAvailable, DispatchPallet } from "@/features/dispatch/types"
import { FormSectionCard } from "@/features/production/shared/FormSectionCard"
import { SectionStep } from "@/features/production/shared/formUi"
import { ApiError } from "@/shared/api/client"
import { PageShell } from "@/shared/catalog/PageShell"
import { LabeledField } from "@/shared/catalog/LabeledField"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { formatKgDisplay } from "@/shared/format/numbers"

function BobinaRow({
  bobina,
  selected,
  onToggle,
}: {
  bobina: BobinaAvailable
  selected: boolean
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
        selected
          ? "border-violet-300 bg-violet-50/70 ring-1 ring-violet-100"
          : "border-slate-200 bg-white hover:border-slate-300",
      )}
    >
      <input
        type="checkbox"
        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
        checked={selected}
        onChange={onToggle}
      />
      <CircleDot className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{bobina.coil_code}</span>
        </div>
        {bobina.client_name ? (
          <p className="text-xs text-slate-600">Cliente: {bobina.client_name}</p>
        ) : null}
        {bobina.shift ? (
          <p className="text-xs text-violet-700">Turno: {extrusionShiftLabel(bobina.shift)}</p>
        ) : null}
      </div>
    </label>
  )
}

function palletForPrint(pallet: DispatchPallet) {
  return {
    ...pallet,
    coils:
      pallet.coils ??
      pallet.coil_codes.map((code, i) => ({
        coil_id: i,
        coil_code: code,
        kg: "0",
        shift: null,
      })),
  }
}

export function DispatchPage() {
  const {
    bobinas,
    allBobinas,
    filterWorkOrderId,
    loading,
    selectedIds,
    toggleBobina,
    drafts,
    activeDraft,
    activeDraftKey,
    setActiveDraftKey,
    assignSelectionToActiveDraft,
    addPallet,
    patchDraft,
    patchCoilWeight,
    patchCoilShift,
    draftTotalKg,
    history,
    historyLoading,
    historyFromDate,
    historyToDate,
    setHistoryFromDate,
    setHistoryToDate,
    reloadHistory,
    confirming,
    confirmDispatch,
    lastConfirmedPallets,
  } = useDispatchWizard()

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const inventory = useMemo(() => bobinasInventoryTotals(bobinas), [bobinas])

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const [printingPalletId, setPrintingPalletId] = useState<number | null>(null)
  const [showPackingPreview, setShowPackingPreview] = useState(false)
  const [showCoilPreview, setShowCoilPreview] = useState(false)
  const [showListPreview, setShowListPreview] = useState(false)

  async function loadPalletForPrint(palletId: number): Promise<DispatchPallet | null> {
    setPrintingPalletId(palletId)
    try {
      return await fetchDispatchPallet(palletId)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : DISPATCH_LABELS.historyLoadError
      toast.error(message)
      return null
    } finally {
      setPrintingPalletId(null)
    }
  }

  async function handleHistoryPackingPrint(palletId: number) {
    const pallet = await loadPalletForPrint(palletId)
    if (!pallet) return
    openPackingListPrint([palletForPrintList(pallet)])
  }

  async function handleHistoryCoilLabelsPrint(palletId: number) {
    const pallet = await loadPalletForPrint(palletId)
    if (!pallet) return
    openAllCoilLabelsPrint(palletForPrintList(pallet))
  }

  function draftToPreview(draft: PalletDraft, index: number) {
    return {
      code: draftPalletLabel(index),
      pallet_number: index + 1,
      display_label: draftPalletLabel(index),
      client_name: draft.clientName || undefined,
      destination: draft.destination || undefined,
      product_name: draft.productName || undefined,
      measurements: draft.measurements || undefined,
      total_kg: String(draftTotalKg(draft)),
      created_at: new Date().toISOString(),
      coils: draft.coilIds.map((coilId) => {
        const bobina = allBobinas.find((b) => b.id === coilId)
        return {
          coil_id: coilId,
          coil_code: bobina?.coil_code ?? String(coilId),
          kg: draft.coilWeights[coilId] ?? "",
          shift: draft.coilShifts[coilId] || undefined,
          work_order_code: bobina?.work_order_code,
          client_order_code: bobina?.client_order_code,
        }
      }),
    }
  }

  function draftPalletPreview() {
    if (!activeDraft) return null
    const index = drafts.findIndex((d) => d.key === activeDraft.key)
    return draftToPreview(activeDraft, index)
  }

  function draftBatchPreview() {
    return drafts
      .map((draft, index) => (draft.coilIds.length > 0 ? draftToPreview(draft, index) : null))
      .filter((item): item is NonNullable<typeof item> => item != null)
  }

  function palletForPrintList(pallet: DispatchPallet) {
    const base = palletForPrint(pallet)
    return {
      ...base,
      pallet_number: pallet.pallet_number,
      display_label: pallet.display_label ?? undefined,
    }
  }

  return (
    <PageShell
      title={DISPATCH_LABELS.title}
      subtitle={DISPATCH_LABELS.subtitle}
      subtitleIcon={Truck}
      icon={Truck}
    >
      <div className="mx-auto mb-4 flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-sky-200/80 bg-sky-50/70 px-4 py-3.5 text-sm text-sky-950 shadow-sm">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-700">
            <Info className="h-4 w-4" aria-hidden />
          </span>
          <p className="font-medium">{DISPATCH_LABELS.helpFlow}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              to={
                filterWorkOrderId
                  ? `/inventario-bolsones?work_order_id=${filterWorkOrderId}`
                  : "/inventario-bolsones"
              }
            >
              <Package className="h-3.5 w-3.5" aria-hidden />
              {DISPATCH_LABELS.subproductsLinkBolsones}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to={
                filterWorkOrderId
                  ? `/inventario-desperdicio?work_order_id=${filterWorkOrderId}`
                  : "/inventario-desperdicio"
              }
            >
              <Recycle className="h-3.5 w-3.5" aria-hidden />
              {DISPATCH_LABELS.subproductsLinkDesperdicio}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 pb-4">
        <FormSectionCard
          title={DISPATCH_LABELS.registry.title}
          description={DISPATCH_LABELS.sections.outboundRegistryHint}
        >
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <LabeledField htmlFor="dispatch-history-from" label={DISPATCH_LABELS.historyDateFrom}>
              <Input
                id="dispatch-history-from"
                type="date"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
              />
            </LabeledField>
            <LabeledField htmlFor="dispatch-history-to" label={DISPATCH_LABELS.historyDateTo}>
              <Input
                id="dispatch-history-to"
                type="date"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
              />
            </LabeledField>
            <Button type="button" variant="outline" size="sm" onClick={() => void reloadHistory()}>
              {DISPATCH_LABELS.historyApplyDates}
            </Button>
            <p className="w-full text-xs text-slate-500">{DISPATCH_LABELS.historyDateHint}</p>
          </div>
          <DispatchOutboundRegistry
            items={history}
            loading={historyLoading}
            printingPalletId={printingPalletId}
            onReprintPacking={(id) => void handleHistoryPackingPrint(id)}
            onReprintCoilLabels={(id) => void handleHistoryCoilLabelsPrint(id)}
          />
        </FormSectionCard>

        <FormSectionCard
          title={DISPATCH_LABELS.sections.bobinas}
          description={DISPATCH_LABELS.sections.bobinasHint}
          action={<SectionStep n={1} />}
        >
          {filterWorkOrderId ? (
            <p className="rounded-lg border border-violet-200 bg-violet-50/60 px-3 py-2 text-xs font-medium text-violet-800">
              {DISPATCH_LABELS.filteredWorkHint(filterWorkOrderId)}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-slate-500">Cargando…</p>
          ) : bobinas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
              {DISPATCH_LABELS.noBobinas}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900">
                <Package className="h-3.5 w-3.5" aria-hidden />
                {DISPATCH_LABELS.inventorySummary(inventory.order_count, inventory.coil_count)}
              </p>

              <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
                {inventory.groups.map((group) => {
                  const collapsed = collapsedGroups.has(group.key)
                  const orderLabel =
                    group.client_order_code ??
                    group.work_order_code ??
                    (group.work_order_id ? `Trabajo #${group.work_order_id}` : "Sin orden")
                  return (
                    <li
                      key={group.key}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                        onClick={() => toggleGroup(group.key)}
                      >
                        {collapsed ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-violet-800">OP: {orderLabel}</span>
                            {(group.work_order_code ?? group.client_order_code) &&
                            group.client_order_code &&
                            group.work_order_code ? (
                              <span className="text-xs font-medium text-emerald-700">
                                TP: {group.work_order_code}
                              </span>
                            ) : null}
                          </div>
                          {group.client_name ? (
                            <p className="text-xs text-slate-600">{group.client_name}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-slate-800">
                            {DISPATCH_LABELS.orderGroupBobinas(group.coil_count)}
                          </p>
                        </div>
                      </button>

                      {!collapsed ? (
                        <ul className="space-y-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2">
                          {group.bobinas.map((bobina) => (
                            <li key={bobina.id}>
                              <BobinaRow
                                bobina={bobina}
                                selected={selectedIds.has(bobina.id)}
                                onToggle={() => toggleBobina(bobina.id)}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {DISPATCH_LABELS.selectedCount}: {selectedIds.size}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={selectedIds.size === 0}
              onClick={assignSelectionToActiveDraft}
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              {DISPATCH_LABELS.assignToPallet}
            </Button>
          </div>
        </FormSectionCard>

        <DispatchSubproductsSection filterWorkOrderId={filterWorkOrderId} />

        <FormSectionCard
          title={DISPATCH_LABELS.sections.pallet}
          description={DISPATCH_LABELS.sections.palletHint}
          action={
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addPallet}>
                <Plus className="h-3.5 w-3.5" aria-hidden />
                {DISPATCH_LABELS.newPallet}
              </Button>
              <SectionStep n={2} />
            </div>
          }
        >
          <div className="flex flex-wrap gap-2">
            {drafts.map((draft, index) => (
              <Button
                key={draft.key}
                type="button"
                size="sm"
                variant={draft.key === activeDraftKey ? "default" : "outline"}
                onClick={() => setActiveDraftKey(draft.key)}
              >
                <Package className="h-3.5 w-3.5" aria-hidden />
                Paleta {index + 1} ({draft.coilIds.length})
              </Button>
            ))}
          </div>

          {activeDraft ? (
            <div className="space-y-3 rounded-xl border border-violet-200/70 bg-white p-4 shadow-sm ring-1 ring-violet-100/80">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <Scale className="h-3 w-3" aria-hidden />
                Bobinas: {activeDraft.coilIds.length} · Total: {formatKgDisplay(draftTotalKg(activeDraft))}
              </p>

              <LabeledField htmlFor="disp-client" label={DISPATCH_LABELS.clientName} icon={Building2}>
                <Input
                  id="disp-client"
                  value={activeDraft.clientName}
                  placeholder={DISPATCH_LABELS.placeholders.clientName}
                  onChange={(e) => patchDraft(activeDraft.key, { clientName: e.target.value })}
                />
              </LabeledField>

              <LabeledField htmlFor="disp-dest" label={DISPATCH_LABELS.destination} icon={MapPin}>
                <Input
                  id="disp-dest"
                  value={activeDraft.destination}
                  placeholder={DISPATCH_LABELS.placeholders.destination}
                  onChange={(e) => patchDraft(activeDraft.key, { destination: e.target.value })}
                />
              </LabeledField>

              <LabeledField htmlFor="disp-product" label={DISPATCH_LABELS.productName} icon={Tag}>
                <Input
                  id="disp-product"
                  value={activeDraft.productName}
                  placeholder={DISPATCH_LABELS.placeholders.productName}
                  onChange={(e) => patchDraft(activeDraft.key, { productName: e.target.value })}
                />
              </LabeledField>

              <LabeledField htmlFor="disp-measures" label={DISPATCH_LABELS.measurements} icon={Ruler}>
                <Input
                  id="disp-measures"
                  placeholder={DISPATCH_LABELS.placeholders.measurements}
                  value={activeDraft.measurements}
                  onChange={(e) => patchDraft(activeDraft.key, { measurements: e.target.value })}
                />
              </LabeledField>

              <LabeledField htmlFor="disp-notes" label={DISPATCH_LABELS.notes} icon={MessageSquareText}>
                <Input
                  id="disp-notes"
                  value={activeDraft.notes}
                  placeholder={DISPATCH_LABELS.placeholders.notes}
                  onChange={(e) => patchDraft(activeDraft.key, { notes: e.target.value })}
                />
              </LabeledField>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeDraft.coilIds.length === 0}
                  onClick={() => setShowPackingPreview((v) => !v)}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  {DISPATCH_LABELS.previewPacking}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeDraft.coilIds.length === 0}
                  onClick={() => setShowCoilPreview((v) => !v)}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                  {DISPATCH_LABELS.previewCoilLabels}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeDraft.coilIds.length === 0}
                  onClick={() => {
                    const preview = draftPalletPreview()
                    if (preview) openPackingPrint({ pallet: preview })
                  }}
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  {DISPATCH_LABELS.printPacking}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={activeDraft.coilIds.length === 0}
                  onClick={() => {
                    const preview = draftPalletPreview()
                    if (preview) openAllCoilLabelsPrint(preview)
                  }}
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  {DISPATCH_LABELS.printCoilLabels}
                </Button>
              </div>

              {showPackingPreview && activeDraft.coilIds.length > 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <DispatchPackingListPreview pallets={[draftPalletPreview()!]} />
                </div>
              ) : null}

              {showCoilPreview && activeDraft.coilIds.length > 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                  <DispatchCoilLabelsPreview pallet={draftPalletPreview()!} />
                </div>
              ) : null}

              {activeDraft.coilIds.length > 0 ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Scale className="h-3.5 w-3.5 text-violet-600" aria-hidden />
                    {DISPATCH_LABELS.weightGridTitle}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {activeDraft.coilIds.map((coilId, index) => {
                      const bobina = allBobinas.find((b) => b.id === coilId)
                      return (
                        <div
                          key={coilId}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2"
                        >
                          <span className="w-8 text-xs tabular-nums text-slate-400">{index + 1}</span>
                          <span className="min-w-0 flex-1 truncate font-mono text-xs">
                            {bobina?.coil_code ?? coilId}
                          </span>
                          <select
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
                            value={activeDraft.coilShifts[coilId] ?? ""}
                            onChange={(e) => patchCoilShift(activeDraft.key, coilId, e.target.value)}
                            aria-label={DISPATCH_LABELS.placeholders.coilShift}
                          >
                            <option value="">{DISPATCH_LABELS.placeholders.coilShift}</option>
                            {EXTRUSION_SHIFTS.map((shift) => (
                              <option key={shift} value={shift}>
                                {extrusionShiftLabel(shift)}
                              </option>
                            ))}
                          </select>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="h-8 w-24 text-right tabular-nums"
                            placeholder={DISPATCH_LABELS.placeholders.coilWeight}
                            value={activeDraft.coilWeights[coilId] ?? ""}
                            onChange={(e) => patchCoilWeight(activeDraft.key, coilId, e.target.value)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </FormSectionCard>

        <FormSectionCard
          title={DISPATCH_LABELS.sections.confirm}
          description={DISPATCH_LABELS.sections.confirmHint}
          className="border-violet-200/80 bg-violet-50/40"
          action={<SectionStep n={3} />}
        >
          {draftBatchPreview().length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowListPreview((v) => !v)}>
                <Eye className="h-3.5 w-3.5" aria-hidden />
                {DISPATCH_LABELS.previewPackingList}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openPackingListPrint(draftBatchPreview())}
              >
                <Printer className="h-3.5 w-3.5" aria-hidden />
                {DISPATCH_LABELS.printPackingList}
              </Button>
            </div>
          ) : null}

          {showListPreview && draftBatchPreview().length > 0 ? (
            <DispatchPackingListPreview pallets={draftBatchPreview()} />
          ) : null}

          <Button type="button" disabled={confirming} onClick={() => void confirmDispatch()}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            {confirming ? DISPATCH_LABELS.confirming : DISPATCH_LABELS.confirm}
          </Button>
        </FormSectionCard>

        {lastConfirmedPallets.length > 0 ? (
          <FormSectionCard
            title={DISPATCH_LABELS.sections.lastBatch}
            description={DISPATCH_LABELS.sections.lastBatchHint}
            className="border-emerald-200/80 bg-emerald-50/40"
          >
            <ul className="space-y-1 text-sm text-slate-700">
              {lastConfirmedPallets.map((pallet) => (
                <li key={pallet.id}>
                  {formatPalletLabel(pallet)} · {formatKgDisplay(pallet.total_kg)} ·{" "}
                  {pallet.coils?.length ?? pallet.coil_codes.length} bobinas
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() =>
                  openPackingListPrint(lastConfirmedPallets.map((pallet) => palletForPrintList(pallet)))
                }
              >
                <Printer className="h-3.5 w-3.5" aria-hidden />
                {DISPATCH_LABELS.printPackingList}
              </Button>
              {lastConfirmedPallets.map((pallet) => (
                <Button
                  key={pallet.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openPackingListPrint([palletForPrintList(pallet)])}
                >
                  {formatPalletLabel(pallet)} — {DISPATCH_LABELS.reprintPacking}
                </Button>
              ))}
            </div>
            <DispatchPackingListPreview
              pallets={lastConfirmedPallets.map((pallet) => palletForPrintList(pallet))}
            />
          </FormSectionCard>
        ) : null}
      </div>
    </PageShell>
  )
}
