export type Client = {
  id: number
  name: string
  active: boolean
  photo_url?: string | null
  rif: string | null
  state: string | null
  city: string | null
  vendor_id?: number | null
  vendor_name?: string | null
  address: string | null
  email: string | null
  phone: string | null
  created_at?: string
  updated_at?: string
}

export type ClientInput = {
  name: string
  active?: boolean
  no_rif?: boolean
  rif: string | null
  state?: string | null
  city?: string | null
  address?: string | null
  email?: string | null
  phone?: string | null
  vendor_id?: number | null
}

export type ClientListQuery = {
  q?: string
  page?: number
  per_page?: number
  active?: 0 | 1
}

export type ClientViewTab = "active" | "inactive"
