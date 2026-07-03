from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from modules.production.helpers import ClientBrief, ProductBrief


class ClientOrderLink(BaseModel):
    id: int
    code: str | None = None
    batch_code: str | None = None


class WorkOrderRead(BaseModel):
    id: int
    code: str
    document_date: date | None = None
    created_at: datetime | None = None
    status: str
    board_stage: str | None = None
    scheduling_status: str | None = None
    client: ClientBrief | None = None
    product: ProductBrief | None = None
    client_order: ClientOrderLink | None = None
    order_quantity: str | None = None
    order_unit: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PendingClientOrderRead(BaseModel):
    id: int
    client_id: int
    code: str
    status: str
    notes: str | None = None
    client: ClientBrief | None = None
    lines_count: int | None = None
    first_line_with_product: dict | None = None


class PendingClientOrderLineRead(BaseModel):
    line_id: int
    client_order_id: int
    order_code: str
    line_seq: int
    quantity: str
    unit: str | None = None
    client: ClientBrief | None = None
    product: ProductBrief | None = None


class ProgramacionBoardRead(BaseModel):
    columns: dict[str, list[WorkOrderRead]]
    pending_lines: list[PendingClientOrderLineRead] = []
    active_extrusion_work_order_ids: list[int] = []


class WorkOrderCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    client_order_id: int
    client_order_line_id: int | None = None
    import_client_order_lines: bool = True
    auto_create_material_request: bool = False
    board_stage: str = "nueva"


class WorkOrderUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    board_stage: str | None = None
    status: str | None = None
