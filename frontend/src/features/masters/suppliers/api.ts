import { deleteJson, getJson, patchJson, postFormData, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type { Supplier, SupplierInput, SupplierListQuery } from "@/features/masters/suppliers/types"

export async function fetchSuppliers(
  query: SupplierListQuery = {},
): Promise<PaginatedResponse<Supplier>> {
  return getJson<PaginatedResponse<Supplier>>("suppliers", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    active: query.active,
  })
}

export async function setSupplierActive(id: number, active: boolean): Promise<Supplier> {
  return patchJson<Supplier>(`suppliers/${id}`, { active })
}

export async function fetchSupplier(id: number): Promise<Supplier> {
  return getJson<Supplier>(`suppliers/${id}`)
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  return postJson<Supplier>("suppliers", input)
}

export async function updateSupplier(id: number, input: SupplierInput): Promise<Supplier> {
  return patchJson<Supplier>(`suppliers/${id}`, input)
}

export async function uploadSupplierPhoto(id: number, file: File): Promise<Supplier> {
  const formData = new FormData()
  formData.append("file", file)
  return postFormData<Supplier>(`suppliers/${id}/photo`, formData)
}

export async function deleteSupplierPhoto(id: number): Promise<Supplier> {
  return deleteJson<Supplier>(`suppliers/${id}/photo`)
}
