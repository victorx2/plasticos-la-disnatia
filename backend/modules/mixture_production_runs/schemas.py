from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class MixtureProductionRunInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    tinta_mixture_id: int
    work_order_id: int


class MixtureProductionCompleteInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    fully_used: bool
    remaining_kg: str | float | int | None = None
    reason: str | None = None
    used_in_work_order_id: int | None = None


class MixtureReturnToWarehouseInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    kg: str | float | int
    notes: str | None = None


class MixtureReturnToWarehouseRead(BaseModel):
    material_request_id: int
    kg: str
    kg_remaining: str


class MixtureProductionRunRead(BaseModel):
    id: int
    tinta_mixture_id: int
    work_order_id: int
    status: str
    fully_used: bool | None = None
    remaining_kg: str | None = None
    reason: str | None = None
    used_in_work_order_id: int | None = None
    produced_kg: str | None = None
    extrusion_run_id: int | None = None
    inbound_material_request_id: int | None = None
    mixture_output_name: str | None = None
    mixture_output_sku: str | None = None
    work_order_code: str | None = None
    used_in_work_order_code: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class MixtureProductionHistoryEntry(MixtureProductionRunRead):
    history_role: str


class MixtureBeginExtrusionRead(BaseModel):
    mixture_run: MixtureProductionRunRead
    mixture_initial_kg: str
    mixture_available_kg: str
    mixture_dispatched_kg: str
    extrusion_session_id: int
    work_order_id: int


class PaginatedMixtureProductionRuns(BaseModel):
    data: list[MixtureProductionRunRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
