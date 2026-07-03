from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import MaterialBrief, decimal_str


class InventoryReturnInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    material_id: int | None = None
    work_order_id: int | None = None
    extrusion_run_id: int | None = None
    extrusion_coil_id: int | None = None
    product_type: str | None = None
    shift: str | None = None
    quantity_units: int | None = None
    destination_area: str
    quantity: str | float | int
    reason: str | None = None


class InventoryReturnLineInput(BaseModel):
    product_key: str = Field(min_length=1)
    quantity_units: int = Field(ge=1, default=1)


class InventoryReturnBatchInput(BaseModel):
    work_order_id: int = Field(ge=1)
    reason: str | None = None
    return_route: str = "fallas"
    lines: list[InventoryReturnLineInput] = Field(min_length=1)


class ReturnableProductRead(BaseModel):
    key: str
    product_type: str
    label: str
    extrusion_coil_id: int | None = None
    extrusion_run_id: int | None = None
    shift: str | None = None
    kg_per_unit: str
    kg_available: str
    max_units: int
    measure: str | None = None
    product_name: str | None = None


class InventoryReturnAcceptInput(BaseModel):
    reason: str | None = None


class InventoryReturnRead(BaseModel):
    id: int
    material_id: int | None = None
    work_order_id: int | None = None
    extrusion_run_id: int | None = None
    extrusion_coil_id: int | None = None
    product_type: str | None = None
    shift: str | None = None
    quantity_units: int | None = None
    destination_area: str
    quantity: str
    status: str
    reason: str | None = None
    material: MaterialBrief | None = None
    work_order: dict | None = None
    product_label: str | None = None
    coil_code: str | None = None
    sent_to_materials: bool = False
    created_at: datetime | None = None


class PaginatedInventoryReturns(BaseModel):
    data: list[InventoryReturnRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
