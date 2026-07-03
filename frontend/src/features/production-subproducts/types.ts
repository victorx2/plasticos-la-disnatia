export type BolsonesPending = {
  item_key: string
  entry_kind: string
  work_order_id?: number | null
  manual_entry_id?: number | null
  description?: string | null
  measure?: string | null
  work_order_code?: string | null
  client_order_code?: string | null
  client_name?: string | null
  produced_kg: string
  production_kg?: string
  manual_kg?: string
  dispatched_kg: string
  pending_kg: string
}

export type DesperdicioPending = {
  item_key: string
  entry_kind: string
  work_order_id?: number | null
  manual_entry_id?: number | null
  description?: string | null
  work_order_code?: string | null
  client_order_code?: string | null
  client_name?: string | null
  refil_kg: string
  transparente_kg: string
  produced_kg: string
  dispatched_kg: string
  pending_kg: string
}

export type FallasPending = {
  item_key: string
  entry_kind: string
  work_order_id?: number | null
  manual_entry_id?: number | null
  description?: string | null
  work_order_code?: string | null
  client_order_code?: string | null
  client_name?: string | null
  extrusion_kg: string
  returns_kg: string
  produced_kg: string
  sent_to_materials_kg: string
  pending_kg: string
}

export type FallasMaterialsShipment = {
  id: number
  work_order_id?: number | null
  manual_entry_id?: number | null
  inventory_return_id?: number | null
  kg: string
  status: string
  notes?: string | null
  created_at?: string
}

export type BolsonesEntryInput = {
  measure: string
  kg: number | string
  description?: string | null
  notes?: string | null
}

export type BolsonesShipmentInput = {
  measure: string
  kg: number | string
  notes?: string | null
}

export type DesperdicioEntryInput = {
  description: string
  kg: number | string
  waste_type?: "refil" | "transparente" | null
  notes?: string | null
}

export type SubproductShipmentInput = {
  work_order_id?: number | null
  manual_entry_id?: number | null
  measure?: string | null
  kg: number | string
  notes?: string | null
}

export type SubproductInDispatch = {
  item_key: string
  work_order_id?: number | null
  manual_entry_id?: number | null
  description?: string | null
  measure?: string | null
  work_order_code?: string | null
  client_order_code?: string | null
  client_name?: string | null
  in_dispatch_kg: string
  shipped_kg: string
  released_kg: string
}
