import type { Client } from "@/features/masters/clients/types"

export type Product = {
  id: number
  client_id: number | null
  name: string
  barcode?: string | null
  cpe: string | null
  mps: string | null
  print_type: string | null
  structure: string | null
  client?: Pick<Client, "id" | "name"> | null
  created_at?: string
  updated_at?: string
}

export type ProductInput = {
  client_id: number
  name: string
  barcode?: string | null
  cpe?: string | null
  mps?: string | null
  print_type?: string | null
  structure?: string | null
}

export type ProductListQuery = {
  q?: string
  page?: number
  per_page?: number
  client_id?: number
}

export const PRODUCT_PRINT_TYPES = ["Superficie", "Bilaminado", "Trilaminado"] as const

export type ProductPrintType = (typeof PRODUCT_PRINT_TYPES)[number]
