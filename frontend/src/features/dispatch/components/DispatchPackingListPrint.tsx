import { buildPackingListHtml, type PackingListPallet } from "@/features/dispatch/components/packingListLayout"
import { openPrintHtmlWithFallback } from "@/shared/print/openPrintHtml"

export type { PackingListPallet } from "@/features/dispatch/components/packingListLayout"

export function openPackingListPrint(pallets: PackingListPallet[]): void {
  if (!pallets.length) return
  const html = buildPackingListHtml(pallets)
  openPrintHtmlWithFallback(html, {
    title: "Lista de empaque",
    filename: `lista-empaque-${Date.now()}.html`,
    autoPrint: true,
  })
}
