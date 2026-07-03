import type { Material } from "@/features/materials/types"

export type MovementType = "in" | "out" | "adjustment_add" | "adjustment_sub"

export type InventoryMovement = {
  id: number
  material_id: number
  movement_type: MovementType | string
  quantity: string | number
  reference_type?: string | null
  reference_id?: number | null
  user_id?: number | null
  occurred_at: string
  reason?: string | null
  is_manual_adjustment?: boolean
  material?: Pick<Material, "id" | "sku" | "name" | "inventory_area" | "unit"> | null
  user?: { id: number; name: string; email?: string } | null
}

export type InventoryMovementListQuery = {
  q?: string
  page?: number
  per_page?: number
  from?: string
  to?: string
  movement_type?: string
  inventory_area?: string
  reference_type?: string
  search?: string
}
