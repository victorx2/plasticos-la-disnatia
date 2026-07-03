export type PalletLabelSource = {
  pallet_number?: number | null
  display_label?: string | null
  code: string
}

export function formatPalletLabel(pallet: PalletLabelSource): string {
  if (pallet.display_label?.trim()) return pallet.display_label.trim()
  if (pallet.pallet_number != null && pallet.pallet_number > 0) {
    return `PALETA ${pallet.pallet_number}`
  }
  return pallet.code
}

export function draftPalletLabel(index: number): string {
  return `PALETA ${index + 1}`
}
