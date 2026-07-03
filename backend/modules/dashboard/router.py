from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from modules.alerts.service import count_unread_alerts, sync_operational_alerts
from modules.dashboard.schemas import DashboardSummary, LowStockMaterial
from modules.materials.models import InventoryMovement, Material
from modules.production.models import ExtrusionRun, InventoryReturn, MaterialRequest, TintaMixture, TintaMixtureComponent

router = APIRouter(tags=["dashboard"])

_MONTHS_ES = (
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
)


def _month_label(now: datetime) -> str:
    return f"{_MONTHS_ES[now.month - 1].capitalize()} {now.year}"


@router.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary(db: Annotated[Session, Depends(get_db)]) -> DashboardSummary:
    now = datetime.now(timezone.utc)
    today = now.date()

    sync_operational_alerts(db, now)

    materials_total = db.query(func.count(Material.id)).scalar() or 0

    low_stock_rows = (
        db.query(Material)
        .filter(Material.quantity_on_hand <= Material.min_stock)
        .order_by(Material.name)
        .limit(20)
        .all()
    )
    materials_low_stock = [
        LowStockMaterial(id=m.id, sku=m.sku, name=m.name) for m in low_stock_rows
    ]

    movements_today = (
        db.query(func.count(InventoryMovement.id))
        .filter(func.date(InventoryMovement.occurred_at) == today)
        .scalar()
        or 0
    )

    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    extrusion_month = (
        db.query(func.coalesce(func.sum(ExtrusionRun.total_kg), 0))
        .filter(ExtrusionRun.created_at >= month_start)
        .scalar()
    )
    mixing_month = (
        db.query(func.coalesce(func.sum(TintaMixtureComponent.quantity), 0))
        .join(TintaMixture, TintaMixtureComponent.tinta_mixture_id == TintaMixture.id)
        .filter(TintaMixture.created_at >= month_start)
        .scalar()
    )
    material_requests_pending = (
        db.query(func.count(MaterialRequest.id))
        .filter(MaterialRequest.status.in_(["pending", "authorized", "partial", "counter_proposed"]))
        .scalar()
        or 0
    )

    inventory_returns_pending = (
        db.query(func.count(InventoryReturn.id))
        .filter(InventoryReturn.status == "pending")
        .scalar()
        or 0
    )
    rejected_returns_month = (
        db.query(func.coalesce(func.sum(InventoryReturn.quantity), 0))
        .filter(
            InventoryReturn.destination_area == "bobinas_rechazadas",
            InventoryReturn.created_at >= month_start,
        )
        .scalar()
    )

    return DashboardSummary(
        generated_at=now.isoformat(),
        month_label=_month_label(now),
        mixing_month_kg=str(mixing_month or 0),
        extrusion_month_kg=str(extrusion_month or 0),
        materials_total=materials_total,
        rejected_returns_bobinas_month=str(rejected_returns_month or 0),
        inventory_returns_pending=inventory_returns_pending,
        material_requests_pending=material_requests_pending,
        operational_alerts_unread=count_unread_alerts(db),
        movements_today=movements_today,
        materials_low_stock=materials_low_stock,
        production_by_area_month=[],
    )
