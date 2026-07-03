import { getJson, postJson } from "@/shared/api/client"
import type {
  BobinaAvailable,
  DispatchPallet,
  DispatchPalletBatchInput,
  DispatchPalletInput,
  DispatchPalletListItem,
} from "@/features/dispatch/types"

export async function fetchBobinasAvailable(): Promise<BobinaAvailable[]> {
  return getJson<BobinaAvailable[]>("dispatch/bobinas-available")
}

export async function fetchDispatchPallets(query?: {
  work_order_id?: number
  from_date?: string
  to_date?: string
  limit?: number
}): Promise<DispatchPalletListItem[]> {
  return getJson<DispatchPalletListItem[]>("dispatch/pallets", {
    work_order_id: query?.work_order_id,
    from_date: query?.from_date,
    to_date: query?.to_date,
    limit: query?.limit,
  })
}

export async function fetchDispatchPallet(palletId: number): Promise<DispatchPallet> {
  return getJson<DispatchPallet>(`dispatch/pallets/${palletId}`)
}

export async function createDispatchPallet(input: DispatchPalletInput): Promise<DispatchPallet> {
  return postJson<DispatchPallet>("dispatch/pallets", input)
}

export async function createDispatchPalletsBatch(
  input: DispatchPalletBatchInput,
): Promise<DispatchPallet[]> {
  return postJson<DispatchPallet[]>("dispatch/pallets/batch", input)
}
