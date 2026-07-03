from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import RequesterBrief


class AreaRequestRead(BaseModel):
    id: int
    area: str
    title: str | None = None
    body: str | None = None
    status: str
    material_request_id: int
    work_order_id: int | None = None
    requester: RequesterBrief | None = None
    created_at: datetime | None = None
    production_order_number: str | None = None  # <-- Limpio y perfecto
    model_config = ConfigDict(from_attributes=True)


class PaginatedAreaRequests(BaseModel):
    data: list[AreaRequestRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class WarehousePendingCountRead(BaseModel):
    count: int
    manual_pending: int
    ot_planilla_pending: int
