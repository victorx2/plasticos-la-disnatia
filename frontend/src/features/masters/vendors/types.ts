export type Vendor = {
  id: number
  name: string
  phone_primary?: string | null
  phone_secondary?: string | null
  active: boolean
  photo_url?: string | null
  clients_count?: number
  created_at?: string
  updated_at?: string
}

export type VendorInput = {
  name: string
  phone_primary?: string | null
  phone_secondary?: string | null
  active?: boolean
}

export type VendorListQuery = {
  q?: string
  page?: number
  per_page?: number
  active?: 0 | 1
}

export type VendorViewTab = "active" | "inactive"
