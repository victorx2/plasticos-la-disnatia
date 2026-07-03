export type Supplier = {
  id: number
  name: string
  active: boolean
  photo_url?: string | null
  rif: string | null
  email: string | null
  phone: string | null
  address: string | null
  created_at?: string
  updated_at?: string
}

export type SupplierInput = {
  name: string
  active?: boolean
  rif?: string | null
  no_rif?: boolean
  email?: string | null
  phone?: string | null
  address?: string | null
}

export type SupplierListQuery = {
  q?: string
  page?: number
  per_page?: number
  active?: number
}

export type SupplierViewTab = "active" | "inactive"
