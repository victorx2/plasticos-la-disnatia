export type BobinaAvailable = {
  id: number
  coil_code: string
  work_order_id?: number | null
  client_order_code?: string | null
  work_order_code?: string | null
  client_name?: string | null
  tp_code?: string | null
  kg: string
  shift?: string | null
  recorded_at?: string | null
}

export type DispatchCoilWeightInput = {
  coil_id: number
  kg: number | string
  shift?: string | null
}

export type DispatchPalletCoilSummary = {
  coil_code: string
  kg: string
  shift?: string | null
}

export type DispatchPalletListItem = {
  id: number
  code: string
  pallet_number?: number | null
  display_label?: string | null
  dispatch_batch_id?: string | null
  total_kg: string
  client_name?: string | null
  destination?: string | null
  product_name?: string | null
  measurements?: string | null
  coil_count?: number
  coils?: DispatchPalletCoilSummary[]
  created_at?: string | null
}

export type DispatchPalletBatchInput = {
  dispatch_batch_id?: string
  pallets: DispatchPalletInput[]
}

export type DispatchPalletInput = {
  client_name?: string | null
  destination?: string | null
  product_name?: string | null
  measurements?: string | null
  notes?: string | null
  coil_ids?: number[]
  coils?: DispatchCoilWeightInput[]
}

export type DispatchPalletCoil = {
  coil_id: number
  coil_code: string
  kg: string
  shift?: string | null
  client_order_code?: string | null
  work_order_code?: string | null
}

export type DispatchPallet = {
  id: number
  code: string
  pallet_number?: number | null
  display_label?: string | null
  dispatch_batch_id?: string | null
  total_kg: string
  client_name?: string | null
  destination?: string | null
  product_name?: string | null
  measurements?: string | null
  notes?: string | null
  coil_codes: string[]
  coils?: DispatchPalletCoil[]
  created_at?: string
}
