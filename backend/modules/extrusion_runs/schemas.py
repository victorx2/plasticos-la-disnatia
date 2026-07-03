from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExtrusionCoilInput(BaseModel):
    microns: list[float | int]
    kg: str | float | int


class ExtrusionWasteInput(BaseModel):
    waste_type: str
    waste_kg: str | float | int


class ExtrusionRegisterInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    work_order_id: int
    shift: str
    recorded_at: str | datetime | None = None
    started_at: str | datetime | None = None
    ended_at: str | datetime | None = None
    effective_minutes: str | float | int | None = None
    machine: str | None = None
    production_format: str | None = None
    target_kg: str | float | int | None = None
    reassigned_work_order_id: int | None = None
    coils: list[ExtrusionCoilInput]
    waste_lines: list[ExtrusionWasteInput] | None = None


class ExtrusionSessionCreateInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    work_order_id: int
    machine: str | None = None
    target_kg: str | float | int | None = None
    recorded_date: date | str | None = None
    mixture_production_run_id: int | None = None


class ExtrusionSegmentInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    shift: str
    operator_name: str | None = None
    started_at: str | datetime | None = None
    ended_at: str | datetime | None = None
    effective_minutes: str | float | int
    machine: str | None = None
    production_format: str | None = None
    coils: list[ExtrusionCoilInput] = []
    waste_lines: list[ExtrusionWasteInput] | None = None
    bolsones_kg: str | float | int | None = None
    fallas_kg: str | float | int | None = None
    core_kg: str | float | int | None = None
    produced_kg: str | float | int | None = None
    coils_count: int | None = Field(default=None, ge=1, le=99)


class ExtrusionCloseInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reassigned_work_order_id: int | None = None
    last_segment: ExtrusionSegmentInput | None = None
    complete_mixture: bool = False
    mark_work_completed: bool = False
    production_route: str | None = None


class ExtrusionStartInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    work_order_id: int
    shift: str
    machine: str | None = None
    production_format: str | None = None
    target_kg: str | float | int | None = None


class ExtrusionCompleteInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    recorded_at: str | datetime | None = None
    started_at: str | datetime | None = None
    ended_at: str | datetime | None = None
    effective_minutes: str | float | int | None = None
    reassigned_work_order_id: int | None = None
    coils: list[ExtrusionCoilInput]
    waste_lines: list[ExtrusionWasteInput] | None = None


class ExtrusionReassignInput(BaseModel):
    reassigned_work_order_id: int | None = None
    mixture_source_work_order_id: int | None = None


class ExtrusionCoilRead(BaseModel):
    id: int
    microns: list[float]
    kg: str
    coil_code: str | None = None


class ExtrusionWasteRead(BaseModel):
    id: int
    waste_type: str
    waste_kg: str


class ExtrusionSegmentRead(BaseModel):
    id: int
    shift: str
    operator_name: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    effective_minutes: str
    production_format: str | None = None
    machine: str | None = None
    total_kg: str
    core_kg: str | None = None
    recorded_at: datetime | None = None
    coils: list[ExtrusionCoilRead] = []
    waste_lines: list[ExtrusionWasteRead] = []


class ExtrusionRunResponse(BaseModel):
    id: int
    total_kg: str
    total_effective_minutes: str | None = None
    mixture_remaining_kg: str | None = None
    mixture_run_id: int | None = None


class ExtrusionRunRead(BaseModel):
    id: int
    work_order_id: int
    reassigned_work_order_id: int | None = None
    shift: str
    recorded_at: datetime
    recorded_date: date | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    effective_minutes: str | None = None
    total_effective_minutes: str | None = None
    machine: str | None = None
    production_format: str | None = None
    target_kg: str | None = None
    total_kg: str
    status: str
    core_kg: str | None = None
    work_order_code: str | None = None
    reassigned_work_order_code: str | None = None
    production_work_order_id: int | None = None
    production_work_order_code: str | None = None
    created_at: datetime | None = None


class ExtrusionActiveSessionRead(BaseModel):
    session: ExtrusionRunRead
    segments: list[ExtrusionSegmentRead] = []


class ExtrusionRunDetailRead(ExtrusionRunRead):
    coils: list[ExtrusionCoilRead] = []
    waste_lines: list[ExtrusionWasteRead] = []
    segments: list[ExtrusionSegmentRead] = []


class PaginatedExtrusionRuns(BaseModel):
    data: list[ExtrusionRunRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class ExtrusionDailySummary(BaseModel):
    date: date
    shift: str | None = None
    machine: str | None = None
    total_kg: str
    total_bolsones_kg: str
    total_core_kg: str
    total_waste_kg: str
    coils_count: int
    runs_count: int
