import { deleteJson, getJson, patchJson, postFormData, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type { Vendor, VendorInput, VendorListQuery } from "@/features/masters/vendors/types"

export async function fetchVendors(
  query: VendorListQuery = {},
): Promise<PaginatedResponse<Vendor>> {
  return getJson<PaginatedResponse<Vendor>>("vendors", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    active: query.active,
  })
}

export async function fetchVendor(id: number): Promise<Vendor> {
  return getJson<Vendor>(`vendors/${id}`)
}

export async function createVendor(input: VendorInput): Promise<Vendor> {
  return postJson<Vendor>("vendors", input)
}

export async function updateVendor(id: number, input: VendorInput): Promise<Vendor> {
  return patchJson<Vendor>(`vendors/${id}`, input)
}

export async function uploadVendorPhoto(id: number, file: File): Promise<Vendor> {
  const formData = new FormData()
  formData.append("file", file)
  return postFormData<Vendor>(`vendors/${id}/photo`, formData)
}

export async function deleteVendorPhoto(id: number): Promise<Vendor> {
  return deleteJson<Vendor>(`vendors/${id}/photo`)
}

export async function setVendorActive(id: number, active: boolean): Promise<Vendor> {
  return patchJson<Vendor>(`vendors/${id}`, { active })
}
