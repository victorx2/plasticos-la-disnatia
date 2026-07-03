from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from modules.client_orders.schemas import ClientOrderCreate, ClientOrderLineCreate, ClientOrderRead


class ProductionBatchCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    code: str | None = None
    notes: str | None = None
    client_id: int
    ordered_at: date | str | None = None
    sale_for: str | None = None
    order_notes: str | None = None
    lines: list[ClientOrderLineCreate] | None = None


class ProductionBatchAddOrderInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_id: int
    ordered_at: date | str | None = None
    sale_for: str | None = None
    notes: str | None = None
    lines: list[ClientOrderLineCreate] | None = None


class ProductionBatchRead(BaseModel):
    id: int
    code: str
    notes: str | None = None
    created_at: date | None = None
    orders: list[ClientOrderRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
