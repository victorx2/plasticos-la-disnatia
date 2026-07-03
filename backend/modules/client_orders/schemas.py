from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import ClientBrief, ProductBrief, decimal_str


class ClientOrderLineBase(BaseModel):
    product_id: int | None = None
    material_id: int | None = None
    quantity: Decimal | float | str
    unit: str | None = None
    description: str | None = None
    notes: str | None = None


class ClientOrderLineCreate(ClientOrderLineBase):
    model_config = ConfigDict(extra="ignore")


class ClientOrderLineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None = None
    material_id: int | None = None
    quantity: str
    unit: str | None = None
    description: str | None = None
    notes: str | None = None
    product: ProductBrief | None = None

    @classmethod
    def from_orm_line(cls, line) -> "ClientOrderLineRead":
        return cls(
            id=line.id,
            product_id=line.product_id,
            material_id=line.material_id,
            quantity=decimal_str(line.quantity) or "0",
            unit=line.unit,
            description=line.description,
            notes=line.notes,
            product=ProductBrief.model_validate(line.product) if line.product else None,
        )


class ClientOrderBase(BaseModel):
    client_id: int
    code: str | None = None
    status: str | None = "open"
    ordered_at: date | str | None = None
    sale_for: str | None = None
    notes: str | None = None


class ClientOrderCreate(ClientOrderBase):
    model_config = ConfigDict(extra="ignore")

    batch_id: int | None = None
    lines: list[ClientOrderLineCreate] | None = None


class ClientOrderUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_id: int | None = None
    code: str | None = None
    status: str | None = None
    ordered_at: date | str | None = None
    sale_for: str | None = None
    notes: str | None = None
    lines: list[ClientOrderLineCreate] | None = None


class FirstLineWithProduct(BaseModel):
    id: int
    product_id: int
    quantity: str | None = None
    unit: str | None = None
    product: ProductBrief | None = None


class ClientOrderRead(BaseModel):
    id: int
    batch_id: int | None = None
    batch_code: str | None = None
    client_id: int
    code: str
    status: str
    notes: str | None = None
    ordered_at: date | None = None
    sale_for: str | None = None
    client: ClientBrief | None = None
    lines_count: int | None = None
    active_work_orders_count: int | None = None
    first_line_with_product: FirstLineWithProduct | None = None
    lines: list[ClientOrderLineRead] | None = None

    model_config = ConfigDict(from_attributes=True)


class PaginatedClientOrders(BaseModel):
    data: list[ClientOrderRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class ClientOrderHistoryRead(BaseModel):
    order: dict
    work_orders: list[dict]
    material_requests: list[dict]
    extrusion_runs: list[dict]
    dispatch_summary: dict
    timeline: dict
