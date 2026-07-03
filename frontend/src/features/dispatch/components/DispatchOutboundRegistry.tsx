import { History, Printer } from "lucide-react"

import { DISPATCH_LABELS } from "@/features/dispatch/labels"
import type { DispatchPalletListItem } from "@/features/dispatch/types"
import { formatPalletLabel } from "@/features/dispatch/formatPalletLabel"
import { extrusionShiftLabel } from "@/features/production/extrusion/labels"
import {
  CatalogTableBody,
  CatalogTableCell,
  CatalogTableHead,
  CatalogTableHeader,
  CatalogTableHeadRow,
  CatalogTablePanel,
  CatalogTableRow,
} from "@/shared/catalog/CatalogTable"
import { formatKgDisplay } from "@/shared/format/numbers"
import { Button } from "@/shared/ui/button"

function formatRegistryDate(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("es-VE")
}

function shiftLabel(shift?: string | null): string {
  if (!shift?.trim()) return "—"
  return extrusionShiftLabel(shift.trim())
}

function coilSummary(item: DispatchPalletListItem): string {
  const coils = item.coils ?? []
  if (!coils.length) {
    return item.coil_count ? `${item.coil_count} bobinas` : "—"
  }
  return coils.map((coil) => coil.coil_code).join(", ")
}

function shiftSummary(item: DispatchPalletListItem): string {
  const coils = item.coils ?? []
  const shifts = [...new Set(coils.map((coil) => coil.shift).filter(Boolean))]
  if (!shifts.length) return "—"
  return shifts.map((value) => shiftLabel(value)).join(" · ")
}

type DispatchOutboundRegistryProps = {
  items: DispatchPalletListItem[]
  loading: boolean
  printingPalletId: number | null
  onReprintPacking: (palletId: number) => void
  onReprintCoilLabels: (palletId: number) => void
}

export function DispatchOutboundRegistry({
  items,
  loading,
  printingPalletId,
  onReprintPacking,
  onReprintCoilLabels,
}: DispatchOutboundRegistryProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">{DISPATCH_LABELS.historyLoading}</p>
  }

  if (!items.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-sm text-slate-500">
        {DISPATCH_LABELS.historyEmpty}
      </p>
    )
  }

  return (
    <CatalogTablePanel minWidth="920px">
      <CatalogTableHeader>
        <CatalogTableHeadRow>
          <CatalogTableHead>{DISPATCH_LABELS.registry.date}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.pallet}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.client}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.coils}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.shift}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.kg}</CatalogTableHead>
          <CatalogTableHead>{DISPATCH_LABELS.registry.destination}</CatalogTableHead>
          <CatalogTableHead className="text-right">{DISPATCH_LABELS.registry.actions}</CatalogTableHead>
        </CatalogTableHeadRow>
      </CatalogTableHeader>
      <CatalogTableBody>
        {items.map((item) => {
          const busy = printingPalletId === item.id
          return (
            <CatalogTableRow key={item.id}>
              <CatalogTableCell className="whitespace-nowrap text-xs text-slate-600">
                {formatRegistryDate(item.created_at)}
              </CatalogTableCell>
              <CatalogTableCell className="font-semibold text-violet-800">
                {item.display_label ?? formatPalletLabel(item)}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[10rem] truncate text-sm">
                {item.client_name ?? "—"}
                {item.product_name ? (
                  <p className="truncate text-xs text-slate-500">{item.product_name}</p>
                ) : null}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[14rem] font-mono text-xs text-slate-700">
                {coilSummary(item)}
              </CatalogTableCell>
              <CatalogTableCell className="text-sm">{shiftSummary(item)}</CatalogTableCell>
              <CatalogTableCell className="tabular-nums font-medium">
                {formatKgDisplay(item.total_kg)}
              </CatalogTableCell>
              <CatalogTableCell className="max-w-[8rem] truncate text-xs">
                {item.destination ?? "—"}
              </CatalogTableCell>
              <CatalogTableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onReprintPacking(item.id)}
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    {DISPATCH_LABELS.reprintPacking}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onReprintCoilLabels(item.id)}
                  >
                    <Printer className="h-3.5 w-3.5" aria-hidden />
                    {DISPATCH_LABELS.registry.labels}
                  </Button>
                </div>
              </CatalogTableCell>
            </CatalogTableRow>
          )
        })}
      </CatalogTableBody>
    </CatalogTablePanel>
  )
}

export function DispatchOutboundRegistryHeader() {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
      <History className="h-4 w-4 text-violet-600" aria-hidden />
      {DISPATCH_LABELS.registry.title}
    </span>
  )
}
