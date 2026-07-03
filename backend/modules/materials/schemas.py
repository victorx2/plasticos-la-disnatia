from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MaterialBase(BaseModel):
    name: str
    sku: str
    inventory_area: str
    product_type: str | None = None
    brand: str | None = None
    unit: str = "kg"
    quantity_on_hand: Decimal = Field(default=Decimal("0"))
    units_count: Decimal | None = None
    min_stock: Decimal = Field(default=Decimal("0"))
    container_number: str | None = None
    supplier_name: str | None = None
    notes: str | None = None


class MaterialCreate(BaseModel):
    name: str
    sku: str
    inventory_area: str
    product_type: str | None = None
    brand: str | None = None
    unit: str = "kg"
    quantity_on_hand: Decimal | None = None
    units_count: Decimal | None = None
    min_stock: Decimal | None = None
    container_number: str | None = None
    supplier_name: str | None = None
    notes: str | None = None
    supplier_id: int | None = None
    no_supplier_reason: str | None = None
    barcode: str | None = None

    model_config = ConfigDict(extra="ignore")


class MaterialUpdate(BaseModel):
    name: str | None = None
    sku: str | None = None
    inventory_area: str | None = None
    product_type: str | None = None
    brand: str | None = None
    unit: str | None = None
    quantity_on_hand: Decimal | None = None
    units_count: Decimal | None = None
    min_stock: Decimal | None = None
    container_number: str | None = None
    supplier_name: str | None = None
    notes: str | None = None
    supplier_id: int | None = None
    change_reason: str | None = None

    model_config = ConfigDict(extra="ignore")


class MaterialRead(MaterialBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class PaginatedMaterials(BaseModel):
    data: list[MaterialRead]
    current_page: int
    last_page: int
    per_page: int
    total: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class ImportRowError(BaseModel):
    row: int
    message: str


class ImportResult(BaseModel):
    batch_id: int | None = None
    filename: str
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[ImportRowError] = Field(default_factory=list)
