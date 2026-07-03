from datetime import datetime

from pydantic import BaseModel, Field


class InventoryMovementMaterialBrief(BaseModel):
    id: int
    sku: str
    name: str
    inventory_area: str
    unit: str


class InventoryMovementRead(BaseModel):
    id: int
    material_id: int
    movement_type: str
    quantity: str
    reference_type: str | None = None
    reference_id: int | None = None
    occurred_at: datetime
    reason: str | None = None
    material: InventoryMovementMaterialBrief | None = None


class PaginatedInventoryMovements(BaseModel):
    data: list[InventoryMovementRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(None, alias="from")
    to: int | None = None

    model_config = {"populate_by_name": True}
