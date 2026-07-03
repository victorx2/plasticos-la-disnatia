from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.area_requests.schemas import AreaRequestRead, PaginatedAreaRequests, WarehousePendingCountRead
from modules.production.models import AreaRequest, ClientOrder, MaterialRequest, WorkOrder

router = APIRouter(tags=["area-requests"])


def _resolve_production_order_number(row: AreaRequest) -> str | None:
    wo: WorkOrder | None = None
    if row.material_request and row.material_request.work_order:
        wo = row.material_request.work_order
    elif row.work_order_id and hasattr(row, "work_order") and row.work_order:
        wo = row.work_order

    if not wo:
        return None

    client_order: ClientOrder | None = wo.client_order
    if client_order and client_order.batch and client_order.batch.code:
        return client_order.batch.code
    return wo.code or None


def _to_read(row: AreaRequest) -> AreaRequestRead:
    nop = _resolve_production_order_number(row)
    return AreaRequestRead(
        id=row.id,
        area=row.area,
        title=row.title,
        body=row.body,
        status=row.status,
        material_request_id=row.material_request_id,
        work_order_id=row.work_order_id,
        requester={"id": 1, "name": row.requester_name or "Operador"} if row.requester_name else None,
        created_at=row.created_at,
        production_order_number=nop or "—",
    )


def _area_request_query(db: Session):
    return db.query(AreaRequest).options(
        joinedload(AreaRequest.material_request)
        .joinedload(MaterialRequest.work_order)
        .joinedload(WorkOrder.client_order)
        .joinedload(ClientOrder.batch),
        joinedload(AreaRequest.work_order)
        .joinedload(WorkOrder.client_order)
        .joinedload(ClientOrder.batch),
    )


@router.get("/area-requests", response_model=PaginatedAreaRequests)
def list_area_requests(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    area: str | None = None,
    status: str | None = None,
    insumos_only: int | None = None,
    insumos_origin: str | None = None,
) -> PaginatedAreaRequests:
    query = _area_request_query(db)
    if area:
        query = query.filter(AreaRequest.area == area)
    if status:
        query = query.filter(AreaRequest.status == status)
    if insumos_only:
        query = query.filter(AreaRequest.material_request_id.isnot(None))
    if insumos_origin:
        query = query.filter(AreaRequest.insumos_origin == insumos_origin)
    query = query.order_by(AreaRequest.id.desc())
    return PaginatedAreaRequests(**paginate(query, page, per_page, _to_read))


@router.get("/area-requests/warehouse-pending-count", response_model=WarehousePendingCountRead)
def warehouse_pending_count(db: Annotated[Session, Depends(get_db)]) -> WarehousePendingCountRead:
    pending = (
        db.query(AreaRequest)
        .join(MaterialRequest)
        .filter(
            AreaRequest.area == "almacen",
            AreaRequest.status == "pending",
            MaterialRequest.status.notin_(["dispatched", "cancelled", "rejected"]),
        )
        .all()
    )
    manual = sum(1 for row in pending if row.insumos_origin == "manual")
    ot = sum(1 for row in pending if row.insumos_origin == "ot_planilla")
    return WarehousePendingCountRead(count=len(pending), manual_pending=manual, ot_planilla_pending=ot)
