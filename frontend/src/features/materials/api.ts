import { getJson, patchJson, postFormData, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type {
  Material,
  MaterialImportResult,
  MaterialInput,
  MaterialListQuery,
} from "@/features/materials/types"

export async function fetchMaterials(
  query: MaterialListQuery = {},
): Promise<PaginatedResponse<Material>> {
  return getJson<PaginatedResponse<Material>>("materials", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    inventory_area: query.inventory_area,
    stock_state: query.stock_state,
  })
}

export async function fetchMaterial(id: number): Promise<Material> {
  return getJson<Material>(`materials/${id}`)
}

export async function createMaterial(input: MaterialInput): Promise<Material> {
  return postJson<Material>("materials", input)
}

export async function updateMaterial(id: number, input: MaterialInput): Promise<Material> {
  return patchJson<Material>(`materials/${id}`, input)
}

export async function importMaterials(file: File): Promise<MaterialImportResult> {
  const formData = new FormData()
  formData.append("file", file)
  return postFormData<MaterialImportResult>("materials/import", formData)
}
