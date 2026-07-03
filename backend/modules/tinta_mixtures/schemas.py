from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from modules.production.helpers import MaterialBrief, RequesterBrief, WorkOrderBrief, decimal_str


class TintaMixtureComponentInput(BaseModel):
    material_id: int
    quantity: str | float | int


class TintaMixtureComponentRead(BaseModel):
    id: int | None = None
    material_id: int
    quantity: str
    material: MaterialBrief | None = None


class TintaMixtureInput(BaseModel):
    model_config = ConfigDict(extra="ignore")

    output_sku: str
    output_name: str
    output_inventory_area: str | None = None
    output_tinta_subarea: str | None = None
    unit: str | None = "kg"
    notes: str | None = None
    work_order_id: int | None = None
    components: list[TintaMixtureComponentInput]


class TintaMixtureRead(BaseModel):
    id: int
    output_sku: str
    output_name: str
    output_inventory_area: str | None = None
    output_tinta_subarea: str | None = None
    unit: str | None = None
    notes: str | None = None
    work_order_id: int | None = None
    work_order: WorkOrderBrief | None = None
    components_count: int | None = None
    components: list[TintaMixtureComponentRead] | None = None
    creator: RequesterBrief | None = None
    created_at: datetime | None = None
    mixture_kind: str | None = "manual"
    parent_mixture_id: int | None = None
    material_request_id: int | None = None


class PaginatedTintaMixtures(BaseModel):
    data: list[TintaMixtureRead]
    total: int
    current_page: int
    per_page: int
    last_page: int
    from_: int | None = Field(serialization_alias="from")
    to: int | None = None

    model_config = ConfigDict(populate_by_name=True)


class PrincipalBalanceComponentRead(BaseModel):
    material_id: int
    quantity: str
    material: MaterialBrief | None = None


class PrincipalBalanceRead(BaseModel):
    principal_mixture_id: int
    work_order_id: int
    kg_initial: str
    kg_remaining: str
    kg_dispatched: str
    principal_exhausted: bool = False
    components: list[PrincipalBalanceComponentRead]
    initial_components: list[PrincipalBalanceComponentRead] = Field(default_factory=list)


class SubmezclaBalanceRead(BaseModel):
    submezcla_id: int | None = None
    kg_dispatched: str
    kg_used_in_extrusion: str
    kg_used_cross_order: str = "0"
    kg_available: str
    kg_pending_warehouse: str
    kg_after_pending_dispatch: str


class WorkMixtureBalanceRead(BaseModel):
    work_order_id: int
    principal: PrincipalBalanceRead | None = None
    submezcla: SubmezclaBalanceRead | None = None
