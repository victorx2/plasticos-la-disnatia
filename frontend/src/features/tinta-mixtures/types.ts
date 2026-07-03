export type TintaMixtureComponent = {
  id?: number
  material_id: number
  quantity: string | number
  material?: { id: number; sku: string; name: string } | null
}

export type TintaMixture = {
  id: number
  output_sku: string
  output_name: string
  output_inventory_area?: string | null
  output_tinta_subarea?: string | null
  unit?: string | null
  notes?: string | null
  work_order_id?: number | null
  work_order?: { id: number; code: string } | null
  components_count?: number
  components?: TintaMixtureComponent[]
  output_material?: { id: number; sku: string; name: string } | null
  creator?: { id: number; name: string } | null
  created_at?: string
  mixture_kind?: "mezcla" | "submezcla" | "manual" | string | null
  parent_mixture_id?: number | null
  material_request_id?: number | null
}

export type TintaMixtureListQuery = {
  q?: string
  page?: number
  per_page?: number
  work_order_id?: number
  mixture_kind?: string
}

export type TintaMixtureComponentInput = {
  material_id: number
  quantity: string | number
}

export type TintaMixtureInput = {
  output_sku: string
  output_name: string
  output_inventory_area?: string
  output_tinta_subarea?: string | null
  unit?: string
  notes?: string | null
  work_order_id?: number | null
  components: TintaMixtureComponentInput[]
}
