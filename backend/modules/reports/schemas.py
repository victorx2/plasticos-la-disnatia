from datetime import date

from pydantic import BaseModel


class ProductionTimeRow(BaseModel):
    work_order_id: int
    work_order_code: str
    client_name: str | None = None
    effective_minutes: str = "0"
    segment_count: int = 0
    effective_hours: str | None = None
    dead_hours: str | None = None
    utilization_pct: str | None = None


class MixtureMaterialRow(BaseModel):
    material_sku: str
    material_name: str
    total_kg: str


class MixtureConsumptionRow(BaseModel):
    output_sku: str
    output_name: str
    total_kg: str
    components: list[MixtureMaterialRow] = []


class ClientOrderLineReportRow(BaseModel):
    line_id: int | None = None
    work_order_id: int | None = None
    work_order_code: str | None = None
    product_name: str | None = None
    quantity: str
    unit: str | None = None
    target_kg: str | None = None


class MixtureConsumptionByOrderRow(BaseModel):
    client_order_code: str
    client_name: str | None = None
    product_name: str | None = None
    order_target_kg: str | None = None
    kg_remaining: str | None = None
    total_produced_kg: str
    produced_kg_pending_close: str = "0"
    total_mixture_used_kg: str = "0"
    mixture_received_cross_kg: str = "0"
    mixture_sent_cross_kg: str = "0"
    mixture_totals: list[MixtureConsumptionRow]
    mixture_recipe: list[MixtureMaterialRow] = []
    order_lines: list[ClientOrderLineReportRow] = []


class ReportsDateFilter(BaseModel):
    from_date: date | None = None
    to_date: date | None = None


class ProductionGeneralRow(BaseModel):
    work_order_id: int
    work_order_code: str
    client_order_code: str | None = None
    client_name: str | None = None
    total_coils: int
    total_kg: str
    total_bolsones_kg: str


class WasteByOrderRow(BaseModel):
    client_order_code: str | None = None
    work_order_code: str
    refil_kg: str
    transparente_kg: str
    total_kg: str


class WasteConsolidatedRow(BaseModel):
    refil_kg: str
    transparente_kg: str
    total_kg: str


class ProductionMachineOrderRow(BaseModel):
    work_order_id: int
    work_order_code: str
    client_order_code: str | None = None
    total_kg: str
    coils_count: int
    bolsones_kg: str


class ProductionMachineShiftRow(BaseModel):
    shift: str | None = None
    total_kg: str
    coils_count: int
    bolsones_kg: str
    orders: list[ProductionMachineOrderRow]


class ProductionMachineReportRow(BaseModel):
    machine: str | None = None
    total_kg: str
    coils_count: int
    bolsones_kg: str
    shifts: list[ProductionMachineShiftRow]

