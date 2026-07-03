export type OperationalAlert = {
  id: number
  alert_key: string
  category: string
  severity: string
  title: string
  body: string
  href_path: string
  is_read: boolean
  read_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type AlertListQuery = {
  page?: number
  per_page?: number
  unread_only?: boolean
}
