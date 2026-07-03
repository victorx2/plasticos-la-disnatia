from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.pagination import paginate
from app.security import CurrentUser, get_current_user
from modules.alerts.models import OperationalAlert
from modules.alerts.schemas import (
    AlertsSyncRead,
    AlertsUnreadCountRead,
    OperationalAlertRead,
    PaginatedAlerts,
)
from modules.alerts.service import count_unread_alerts, sync_operational_alerts

router = APIRouter(tags=["operational-alerts"])


def _to_read(row: OperationalAlert) -> OperationalAlertRead:
    return OperationalAlertRead.model_validate(row)


@router.get("/operational-alerts", response_model=PaginatedAlerts)
def list_operational_alerts(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: int = Query(1, ge=0, le=1),
) -> PaginatedAlerts:
    sync_operational_alerts(db)

    query = db.query(OperationalAlert)
    if unread_only:
        query = query.filter(OperationalAlert.is_read.is_(False))
    query = query.order_by(OperationalAlert.is_read.asc(), OperationalAlert.updated_at.desc(), OperationalAlert.id.desc())

    unread_total = count_unread_alerts(db)
    payload = paginate(query, page, per_page, _to_read)
    return PaginatedAlerts(**payload, unread_total=unread_total)


@router.get("/operational-alerts/unread-count", response_model=AlertsUnreadCountRead)
def operational_alerts_unread_count(db: Annotated[Session, Depends(get_db)]) -> AlertsUnreadCountRead:
    sync_operational_alerts(db)
    return AlertsUnreadCountRead(count=count_unread_alerts(db))


@router.post("/operational-alerts/sync", response_model=AlertsSyncRead)
def sync_operational_alerts_endpoint(db: Annotated[Session, Depends(get_db)]) -> AlertsSyncRead:
    unread_count = sync_operational_alerts(db)
    total = db.query(OperationalAlert).count()
    return AlertsSyncRead(synced=total, unread_count=unread_count)


@router.post("/operational-alerts/{alert_id}/read", response_model=OperationalAlertRead)
def mark_operational_alert_read(
    alert_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> OperationalAlertRead:
    alert = db.get(OperationalAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alerta no encontrada.")
    if not alert.is_read:
        now = datetime.now(timezone.utc)
        alert.is_read = True
        alert.read_at = now
        alert.read_by_user_id = user.id or None
        alert.updated_at = now
        db.commit()
        db.refresh(alert)
    return _to_read(alert)


@router.post("/operational-alerts/read-all")
def mark_all_operational_alerts_read(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> dict[str, int]:
    sync_operational_alerts(db)
    now = datetime.now(timezone.utc)
    rows = (
        db.query(OperationalAlert)
        .filter(OperationalAlert.is_read.is_(False))
        .all()
    )
    for alert in rows:
        alert.is_read = True
        alert.read_at = now
        alert.read_by_user_id = user.id or None
        alert.updated_at = now
    db.commit()
    return {"updated": len(rows)}
