import { getJson, patchJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  ApiNrocOrder,
  NrocOrder,
  NrocOrderInput,
  NrocOrderListQuery,
  ProductionBatch,
  ProductionBatchInput,
  NrocOrderHistory,
} from "@/features/nroc-orders/types"

function mapNrocOrderFromApi(raw: ApiNrocOrder): NrocOrder {
  const { active_work_orders_count, ...rest } = raw
  return {
    ...rest,
    active_works_count: active_work_orders_count,
  }
}

export async function fetchNrocOrders(
  query: NrocOrderListQuery = {},
): Promise<PaginatedResponse<NrocOrder>> {
  const res = await getJson<PaginatedResponse<ApiNrocOrder>>("client-orders", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    client_id: query.client_id,
    status: query.status,
    batch_id: query.batch_id,
    awaiting_ot: query.awaiting_schedule ? 1 : undefined,
    sort: query.sort,
  })
  return {
    ...res,
    data: res.data.map(mapNrocOrderFromApi),
  }
}

export type NrocOrderTabCounts = {
  all: number
  awaiting_schedule: number
  open: number
  fulfilled: number
}

export async function fetchNrocOrderTabCounts(
  query: Pick<NrocOrderListQuery, "q" | "batch_id"> = {},
): Promise<NrocOrderTabCounts> {
  const base = { ...query, per_page: 1 }
  const [all, awaiting, open, fulfilled] = await Promise.all([
    fetchNrocOrders(base),
    fetchNrocOrders({ ...base, awaiting_schedule: true }),
    fetchNrocOrders({ ...base, status: "open" }),
    fetchNrocOrders({ ...base, status: "fulfilled" }),
  ])
  return {
    all: all.total,
    awaiting_schedule: awaiting.total,
    open: open.total,
    fulfilled: fulfilled.total,
  }
}

export async function fetchNrocOrder(id: number): Promise<NrocOrder> {
  const raw = await getJson<ApiNrocOrder>(`client-orders/${id}`)
  return mapNrocOrderFromApi(raw)
}

export async function fetchNrocOrderHistory(id: number): Promise<NrocOrderHistory> {
  return getJson<NrocOrderHistory>(`client-orders/${id}/history`)
}

export async function createNrocOrder(input: NrocOrderInput): Promise<NrocOrder> {
  const raw = await postJson<ApiNrocOrder>("client-orders", input)
  return mapNrocOrderFromApi(raw)
}

export async function updateNrocOrder(
  id: number,
  input: Partial<NrocOrderInput>,
): Promise<NrocOrder> {
  const raw = await patchJson<ApiNrocOrder>(`client-orders/${id}`, input)
  return mapNrocOrderFromApi(raw)
}

export async function fetchProductionBatch(id: number): Promise<ProductionBatch> {
  return getJson<ProductionBatch>(`production-batches/${id}`)
}

export async function createProductionBatch(input: ProductionBatchInput): Promise<ProductionBatch> {
  return postJson<ProductionBatch>("production-batches", input)
}

export async function addProductionBatchOrder(
  batchId: number,
  input: Omit<NrocOrderInput, "batch_id" | "code">,
): Promise<ProductionBatch> {
  return postJson<ProductionBatch>(`production-batches/${batchId}/orders`, input)
}
