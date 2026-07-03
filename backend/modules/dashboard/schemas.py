from pydantic import BaseModel, Field


class LowStockMaterial(BaseModel):
    id: int
    sku: str
    name: str


class ProductionByAreaMonth(BaseModel):
    label: str
    month_key: str
    tintas_kg: str
    total_kg: str


class DashboardSummary(BaseModel):
    generated_at: str
    month_label: str | None = None
    mixing_month_kg: str | None = None
    extrusion_month_kg: str | None = None
    materials_total: int
    rejected_returns_bobinas_month: int | None = None
    inventory_returns_pending: int
    material_requests_pending: int
    operational_alerts_unread: int
    movements_today: int
    materials_low_stock: list[LowStockMaterial] = Field(default_factory=list)
    production_by_area_month: list[ProductionByAreaMonth] | None = None
