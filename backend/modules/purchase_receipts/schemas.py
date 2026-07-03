from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import MaterialBrief, decimal_str


class SupplierBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rif: str | None = None


class PurchaseOrderBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str


class PurchaseReceiptLineRead(BaseModel):
    id: int
    material_id: int
    item_type: str
    quantity: str
    unit: str
    micras: str | None = None
    ancho_mm: str | None = None
    purchase_order_line_id: int | None = None
    material: MaterialBrief | None = None


class PurchaseReceiptRead(BaseModel):
    id: int
    purchase_order_id: int | None = None
    without_purchase_order: bool = False
    supplier_id: int
    supplier_name: str | None = None
    invoice_number: str | None = None
    purchase_order_reference: str | None = None
    notes: str | None = None
    received_at: datetime | None = None
    lines_count: int | None = None
    lines: list[PurchaseReceiptLineRead] = Field(default_factory=list)
    supplier: SupplierBrief | None = None
    purchase_order: PurchaseOrderBrief | None = None


class PurchaseReceiptLineCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purchase_order_line_id: int
    material_id: int
    item_type: str
    quantity: str | float | int
    unit: str = "kg"
    micras: str | float | int | None = None
    ancho_mm: str | float | int | None = None


class PurchaseReceiptCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    purchase_order_id: int
    without_purchase_order: bool = False
    supplier_id: int
    supplier_name: str | None = None
    invoice_number: str | None = None
    purchase_order_reference: str | None = None
    notes: str | None = None
    received_at: str | datetime | None = None
    lines: list[PurchaseReceiptLineCreate] = Field(default_factory=list)


class DuplicateReceiptMatch(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str | None = None
    invoice_number: str | None = None
    purchase_order_reference: str | None = None
    received_at: datetime | None = None


class DuplicateReceiptCheck(BaseModel):
    has_duplicates: bool
    total_matches: int
    matches: list[DuplicateReceiptMatch] = Field(default_factory=list)


class PaginatedPurchaseReceipts(BaseModel):
    data: list[PurchaseReceiptRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
