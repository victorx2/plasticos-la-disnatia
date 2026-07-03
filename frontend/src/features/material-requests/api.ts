import { getJson, postJson, ApiError } from "@/shared/api/client"
import type {
  MaterialRequest,
  MaterialRequestDetail,
  MaterialRequestDispatchInput,
  MaterialRequestInput,
  MaterialRequestRejectInput,
} from "@/features/material-requests/types"

export async function fetchMaterialRequest(id: number): Promise<MaterialRequestDetail> {
  return getJson<MaterialRequestDetail>(`material-requests/${id}`)
}

/** Última solicitud de insumos (salida a almacén) del trabajo en planta. */
export async function fetchMaterialRequestForWork(
  workOrderId: number,
): Promise<MaterialRequestDetail | null> {
  try {
    return await getJson<MaterialRequestDetail>(`material-requests/by-work/${workOrderId}`)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createMaterialRequest(
  input: MaterialRequestInput,
): Promise<MaterialRequest> {
  return postJson<MaterialRequest>("material-requests", input)
}

export async function authorizeMaterialRequest(id: number): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/authorize`, {})
}

export async function dispatchMaterialRequest(
  id: number,
  input: MaterialRequestDispatchInput,
): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/dispatch`, input)
}

/** Almacén rechaza y opcionalmente propone otra lista de materiales. */
export async function rejectMaterialRequest(
  id: number,
  input: MaterialRequestRejectInput,
): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/reject`, input)
}

/** Producción acepta la contraoferta del almacén. */
export async function acceptMaterialRequestCounter(id: number): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/accept-counter`, {})
}

/** Producción rechaza la contraoferta del almacén. */
export async function rejectMaterialRequestCounter(id: number): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/reject-counter`, {})
}

/** Almacén recibe entrada de producción (mezcla terminada). */
export async function receiveMaterialRequest(id: number): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/receive`, {})
}

/** Cierra manualmente una solicitud abierta (parcial o autorizada). */
export async function closeMaterialRequest(id: number): Promise<MaterialRequest> {
  return postJson<MaterialRequest>(`material-requests/${id}/close`, {})
}
