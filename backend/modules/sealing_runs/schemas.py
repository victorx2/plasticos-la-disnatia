from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SealingBobinaLineInput(BaseModel):
    extrusion_coil_id: int | None = None
    coil_code: str | None = None
    measure: str | None = None
    units: str | float | int
    production_kg: str | float | int | None = None
    waste_kg: str | float | int | None = None


class SealingRunInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    work_order_id: int
    shift: str
    recorded_at: str | datetime | None = None
    started_at: str | datetime | None = None
    ended_at: str | datetime | None = None
    effective_minutes: str | float | int | None = None
    waste_kg: str | float | int | None = None
    notes: str | None = None
    bobina_lines: list[SealingBobinaLineInput] = []


class SealingBobinaLineRead(BaseModel):
    id: int
    extrusion_coil_id: int | None = None
    coil_code: str | None = None
    measure: str | None = None
    units: str
    production_kg: str | None = None
    waste_kg: str | None = None


class SealingExtrusionCoilRead(BaseModel):
    id: int
    coil_code: str
    production_kg: str
    measure: str | None = None


class SealingRunRead(BaseModel):
    id: int
    work_order_id: int
    work_order_code: str | None = None
    shift: str
    recorded_at: datetime
    recorded_date: date | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    effective_minutes: str | None = None
    total_units: str
    waste_kg: str
    notes: str | None = None
    status: str
    bobina_lines: list[SealingBobinaLineRead] = []
    created_at: datetime


class PaginatedSealingRuns(BaseModel):
    data: list[SealingRunRead]
    current_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)
