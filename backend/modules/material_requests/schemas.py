from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import MaterialBrief, RequesterBrief, WorkOrderBrief, decimal_str


class MaterialRequestLineInput(BaseModel):
    material_id: int | None = None
    description: str | None = None
    quantity_requested: str | float | int
    unit: str | None = "kg"


class MaterialRequestLineRead(BaseModel):
    id: int | None = None
    material_id: int | None = None
    description: str | None = None
    quantity_requested: str
    quantity_dispatched: str | None = None
    unit: str | None = None
    material: MaterialBrief | None = None


class MaterialRequestInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    originating_area: str | None = None
    destination_areas: list[str] | None = None
    notes: str | None = None
    document_date: date | str | None = None
    work_order_id: int | None = None
    allow_replenishment: bool = False
    lines: list[MaterialRequestLineInput]


class MaterialRequestDispatchLineInput(BaseModel):
    material_request_line_id: int
    quantity: str | float | int
    material_id: int | None = None


class MaterialRequestDispatchInput(BaseModel):
    lines: list[MaterialRequestDispatchLineInput]


class MaterialRequestRejectInput(BaseModel):
    reason: str
    counter_lines: list[MaterialRequestLineInput] | None = None


class MaterialRequestRead(BaseModel):
    id: int
    status: str
    request_flow: str | None = "outbound"
    originating_area: str | None = None
    destination_areas: list[str] | None = None
    notes: str | None = None
    document_date: date | None = None
    authorized_by: int | None = None
    work_order_id: int | None = None
    work_order: WorkOrderBrief | None = None
    kg_authorized: str | None = None
    kg_dispatched: str | None = None
    kg_remaining: str | None = None
    rejection_reason: str | None = None
    counter_proposal_lines: list[MaterialRequestLineRead] | None = None
    lines: list[MaterialRequestLineRead] | None = None
    requester: RequesterBrief | None = None
    created_at: datetime | None = None
    generated_mixture_id: int | None = None
    principal_kg_remaining: str | None = None
    is_replenishment: bool = False
