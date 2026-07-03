import { deleteJson, getJson, patchJson, postFormData, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type { Client, ClientInput, ClientListQuery } from "@/features/masters/clients/types"

export async function fetchClients(
  query: ClientListQuery = {},
): Promise<PaginatedResponse<Client>> {
  return getJson<PaginatedResponse<Client>>("clients", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    active: query.active,
  })
}

export async function fetchClient(id: number): Promise<Client> {
  return getJson<Client>(`clients/${id}`)
}

export async function createClient(input: ClientInput): Promise<Client> {
  return postJson<Client>("clients", input)
}

export async function updateClient(id: number, input: ClientInput): Promise<Client> {
  return patchJson<Client>(`clients/${id}`, input)
}

export async function setClientActive(id: number, active: boolean): Promise<Client> {
  return patchJson<Client>(`clients/${id}`, { active })
}

export async function uploadClientPhoto(id: number, file: File): Promise<Client> {
  const formData = new FormData()
  formData.append("file", file)
  return postFormData<Client>(`clients/${id}/photo`, formData)
}

export async function deleteClientPhoto(id: number): Promise<Client> {
  return deleteJson<Client>(`clients/${id}/photo`)
}
