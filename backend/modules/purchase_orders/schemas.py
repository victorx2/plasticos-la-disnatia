from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SupplierBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class PurchaseOrderLineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: str | None = None
    material_id: int | None = None
    quantity_ordered: Decimal
    quantity_received: Decimal | None = None
    unit: str | None = None
    unit_price: Decimal | None = None


class PurchaseOrderLineCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: int | None = None
    description: str | None = None
    material_id: int | None = None
    quantity_ordered: Decimal
    unit: str | None = None
    unit_price: Decimal | None = None


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    code: str
    ordered_at: date | None = None
    notes: str | None = None
    tax_applies: bool = False


class PurchaseOrderCreate(PurchaseOrderBase):
    lines: list[PurchaseOrderLineCreate] = Field(default_factory=list)


class PurchaseOrderUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    supplier_id: int | None = None
    code: str | None = None
    ordered_at: date | None = None
    notes: str | None = None
    tax_applies: bool | None = None
    lines: list[PurchaseOrderLineCreate] | None = None
    change_reason: str | None = None


class PurchaseOrderRead(PurchaseOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    is_active: bool = True
    supplier: SupplierBrief | None = None
    lines: list[PurchaseOrderLineRead] = Field(default_factory=list)
    lines_count: int | None = None
    receipts_count: int | None = None
    last_receipt_at: datetime | None = None
    receipt_progress_label: str | None = None
    change_reason: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class PaginatedPurchaseOrders(BaseModel):
    data: list[PurchaseOrderRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
