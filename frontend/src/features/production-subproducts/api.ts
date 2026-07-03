import { getJson, postJson } from "@/shared/api/client"
import type {
  BolsonesPending,
  BolsonesEntryInput,
  BolsonesShipmentInput,
  DesperdicioPending,
  DesperdicioEntryInput,
  FallasMaterialsShipment,
  FallasPending,
  SubproductInDispatch,
  SubproductShipmentInput,
} from "@/features/production-subproducts/types"

export async function fetchBolsonesPending(workOrderId?: number | null): Promise<BolsonesPending[]> {
  const query = workOrderId && workOrderId > 0 ? { work_order_id: workOrderId } : undefined
  return getJson<BolsonesPending[]>("dispatch/bolsones-pending", query)
}

export async function fetchDesperdicioPending(): Promise<DesperdicioPending[]> {
  return getJson<DesperdicioPending[]>("dispatch/desperdicio-pending")
}

export async function createBolsonesEntry(input: BolsonesEntryInput): Promise<void> {
  await postJson("dispatch/bolsones-entries", input)
}

export async function createDesperdicioEntry(input: DesperdicioEntryInput): Promise<void> {
  await postJson("dispatch/desperdicio-entries", input)
}

export async function createBolsonesShipment(input: BolsonesShipmentInput): Promise<void> {
  await postJson("dispatch/bolsones-shipments", input)
}

export async function createDesperdicioShipment(input: SubproductShipmentInput): Promise<void> {
  await postJson("dispatch/desperdicio-shipments", input)
}

export async function fetchBolsonesInDispatch(): Promise<SubproductInDispatch[]> {
  return getJson<SubproductInDispatch[]>("dispatch/bolsones-in-dispatch")
}

export async function fetchDesperdicioInDispatch(): Promise<SubproductInDispatch[]> {
  return getJson<SubproductInDispatch[]>("dispatch/desperdicio-in-dispatch")
}

export async function createBolsonesRelease(input: SubproductShipmentInput): Promise<void> {
  await postJson("dispatch/bolsones-releases", input)
}

export async function createDesperdicioRelease(input: SubproductShipmentInput): Promise<void> {
  await postJson("dispatch/desperdicio-releases", input)
}

export async function fetchFallasPending(): Promise<FallasPending[]> {
  return getJson<FallasPending[]>("dispatch/fallas-pending")
}

export async function createFallasMaterialsShipment(
  input: SubproductShipmentInput,
): Promise<FallasMaterialsShipment> {
  return postJson<FallasMaterialsShipment>("dispatch/fallas-materials-shipments", input)
}

export async function fetchFallasMaterialsPending(): Promise<FallasMaterialsShipment[]> {
  return getJson<FallasMaterialsShipment[]>("dispatch/fallas-materials-shipments/pending")
}

export async function acceptFallasMaterialsShipment(
  id: number,
  reason?: string,
): Promise<FallasMaterialsShipment> {
  return postJson<FallasMaterialsShipment>(`dispatch/fallas-materials-shipments/${id}/accept`, {
    reason: reason ?? null,
  })
}

