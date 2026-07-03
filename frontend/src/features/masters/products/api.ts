import { getJson, patchJson, postJson } from "@/shared/api/client"
import type { PaginatedResponse } from "@/shared/types/pagination"
import type { Product, ProductInput, ProductListQuery } from "@/features/masters/products/types"

export async function fetchProducts(
  query: ProductListQuery = {},
): Promise<PaginatedResponse<Product>> {
  return getJson<PaginatedResponse<Product>>("products", {
    q: query.q,
    page: query.page,
    per_page: query.per_page,
    client_id: query.client_id,
  })
}

export async function fetchProduct(id: number): Promise<Product> {
  return getJson<Product>(`products/${id}`)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return postJson<Product>("products", input)
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  return patchJson<Product>(`products/${id}`, input)
}
