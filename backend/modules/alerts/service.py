from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from modules.alerts.models import OperationalAlert
from modules.materials.models import Material
from modules.production.models import ExtrusionRun, InventoryReturn, MaterialRequest, TintaMixture, TintaMixtureComponent


@dataclass(frozen=True)
class AlertDraft:
    alert_key: str
    category: str
    severity: str
    title: str
    body: str
    href_path: str


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _resolve_mixing_kg(db: Session, month_start: datetime) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(TintaMixtureComponent.quantity), 0))
        .join(TintaMixture, TintaMixtureComponent.tinta_mixture_id == TintaMixture.id)
        .filter(TintaMixture.created_at >= month_start)
        .scalar()
    )
    return Decimal(str(total or 0))


def _resolve_extrusion_kg(db: Session, month_start: datetime) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(ExtrusionRun.total_kg), 0))
        .filter(ExtrusionRun.created_at >= month_start)
        .scalar()
    )
    return Decimal(str(total or 0))


def collect_active_alerts(db: Session, now: datetime | None = None) -> list[AlertDraft]:
    now = now or datetime.now(timezone.utc)
    month_start = _month_start(now)
    drafts: list[AlertDraft] = []

    low_stock_rows = (
        db.query(Material)
        .filter(Material.quantity_on_hand <= Material.min_stock)
        .order_by(Material.name)
        .all()
    )
    for material in low_stock_rows:
        drafts.append(
            AlertDraft(
                alert_key=f"low_stock:{material.id}",
                category="inventory",
                severity="attention",
                title=f"Material bajo mínimo — {material.name}",
                body=(
                    f"SKU {material.sku}: referencia por debajo del stock mínimo "
                    f"({material.quantity_on_hand} / mín. {material.min_stock})."
                ),
                href_path="/materiales",
            )
        )

    material_requests_pending = (
        db.query(func.count(MaterialRequest.id))
        .filter(MaterialRequest.status.in_(["pending", "authorized", "partial", "counter_proposed"]))
        .scalar()
        or 0
    )
    if material_requests_pending > 0:
        drafts.append(
            AlertDraft(
                alert_key="material_requests_pending",
                category="requests",
                severity="attention",
                title=f"Solicitudes de insumos pendientes ({material_requests_pending})",
                body="Pendiente o con entrega parcial en inventario.",
                href_path="/solicitudes-material",
            )
        )

    inventory_returns_pending = (
        db.query(func.count(InventoryReturn.id))
        .filter(InventoryReturn.status == "pending")
        .scalar()
        or 0
    )
    if inventory_returns_pending > 0:
        drafts.append(
            AlertDraft(
                alert_key="inventory_returns_pending",
                category="returns",
                severity="attention",
                title=f"Devoluciones pendientes ({inventory_returns_pending})",
                body="En espera de aceptación en almacén.",
                href_path="/devoluciones",
            )
        )

    mixing_kg = _resolve_mixing_kg(db, month_start)
    extrusion_kg = _resolve_extrusion_kg(db, month_start)
    if mixing_kg > 0 and extrusion_kg == 0:
        drafts.append(
            AlertDraft(
                alert_key="extrusion_gap_month",
                category="production",
                severity="attention",
                title="Extrusión sin registro este mes",
                body=(
                    f"Acumulado del mes: {mixing_kg.normalize()} kg de mezcla registrados "
                    "y 0 kg de bobina extruida."
                ),
                href_path="/extrusion",
            )
        )

    return drafts


def sync_operational_alerts(db: Session, now: datetime | None = None) -> int:
    drafts = collect_active_alerts(db, now)
    active_keys = {draft.alert_key for draft in drafts}
    resolve_now = now or datetime.now(timezone.utc)

    existing_rows = db.query(OperationalAlert).all()
    existing_by_key = {row.alert_key: row for row in existing_rows}

    for draft in drafts:
        row = existing_by_key.get(draft.alert_key)
        if row:
            row.category = draft.category
            row.severity = draft.severity
            row.title = draft.title
            row.body = draft.body
            row.href_path = draft.href_path
            row.updated_at = resolve_now
            continue
        db.add(
            OperationalAlert(
                alert_key=draft.alert_key,
                category=draft.category,
                severity=draft.severity,
                title=draft.title,
                body=draft.body,
                href_path=draft.href_path,
                is_read=False,
            )
        )

    for row in existing_rows:
        if row.alert_key not in active_keys and not row.is_read:
            row.is_read = True
            row.read_at = resolve_now

    db.commit()
    return count_unread_alerts(db)


def count_unread_alerts(db: Session) -> int:
    return (
        db.query(func.count(OperationalAlert.id))
        .filter(OperationalAlert.is_read.is_(False))
        .scalar()
        or 0
    )
