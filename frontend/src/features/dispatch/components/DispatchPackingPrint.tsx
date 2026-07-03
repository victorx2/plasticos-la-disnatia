import { openPackingListPrint } from "@/features/dispatch/components/DispatchPackingListPrint"
import { buildPackingListHtml } from "@/features/dispatch/components/packingListLayout"
import type { DispatchPalletCoil } from "@/features/dispatch/types"

type PackingPrintProps = {
  pallet: {
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
}

/** Imprime una paleta con el mismo formato Excel «lista de empaque». */
export function openPackingPrint(props: PackingPrintProps): void {
  openPackingListPrint([props.pallet])
}

export function buildPackingSummaryHtml(pallet: PackingPrintProps["pallet"]): string {
  return buildPackingListHtml([pallet])
}
