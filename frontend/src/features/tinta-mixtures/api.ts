import { getJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  TintaMixture,
  TintaMixtureInput,
  TintaMixtureListQuery,
} from "@/features/tinta-mixtures/types"

export async function fetchTintaMixtures(
  query: TintaMixtureListQuery = {},
): Promise<PaginatedResponse<TintaMixture>> {
  return getJson<PaginatedResponse<TintaMixture>>("tinta-mixtures", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    work_order_id: query.work_order_id,
    mixture_kind: query.mixture_kind,
  })
}

export type PrincipalBalance = {
  principal_mixture_id: number
  work_order_id: number
  kg_initial: string
  kg_remaining: string
  kg_dispatched: string
  principal_exhausted?: boolean
  components: Array<{
    material_id: number
    quantity: string
    material?: { id: number; sku: string; name: string; unit?: string | null } | null
  }>
  initial_components?: Array<{
    material_id: number
    quantity: string
    material?: { id: number; sku: string; name: string; unit?: string | null } | null
  }>
}

export type SubmezclaBalance = {
  submezcla_id: number | null
  kg_dispatched: string
  kg_used_in_extrusion: string
  kg_used_cross_order?: string
  kg_available: string
  kg_pending_warehouse: string
  kg_after_pending_dispatch: string
}

export type WorkMixtureBalance = {
  work_order_id: number
  principal: PrincipalBalance | null
  submezcla: SubmezclaBalance | null
}

export async function fetchPrincipalBalance(workOrderId: number): Promise<PrincipalBalance | null> {
  try {
    return await getJson<PrincipalBalance>(`tinta-mixtures/principal-balance/${workOrderId}`)
  } catch {
    return null
  }
}

export async function fetchWorkMixtureBalance(workOrderId: number): Promise<WorkMixtureBalance | null> {
  try {
    return await getJson<WorkMixtureBalance>(`tinta-mixtures/work-balance/${workOrderId}`)
  } catch {
    return null
  }
}

export async function createTintaMixture(input: TintaMixtureInput): Promise<TintaMixture> {
  return postJson<TintaMixture>("tinta-mixtures", input)
}
