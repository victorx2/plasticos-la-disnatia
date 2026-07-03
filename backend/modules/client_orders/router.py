from datetime import date
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.client_orders.schemas import (
    ClientOrderCreate,
    ClientOrderHistoryRead,
    ClientOrderLineRead,
    ClientOrderRead,
    ClientOrderUpdate,
    FirstLineWithProduct,
    PaginatedClientOrders,
)
from modules.client_orders.service import build_client_order_history, try_fulfill_client_order
from modules.production.helpers import first_line_with_product, next_code, parse_date
from modules.production.models import Client, ClientOrder, ClientOrderLine, Product, ProductionBatch, WorkOrder
from modules.production_batches.service import add_order_to_batch, ensure_batch_for_order

router = APIRouter(tags=["client-orders"])


def _first_line_with_product(order: ClientOrder) -> FirstLineWithProduct | None:
    raw = first_line_with_product(order)
    return FirstLineWithProduct.model_validate(raw) if raw else None


def _to_read(order: ClientOrder, include_lines: bool = False) -> ClientOrderRead:
    active_count = (
        len([wo for wo in order.work_orders if wo.status != "cancelled"])
        if order.work_orders is not None
        else None
    )
    data = ClientOrderRead(
        id=order.id,
        batch_id=order.batch_id,
        batch_code=order.batch.code if order.batch else None,
        client_id=order.client_id,
        code=order.code,
        status=order.status,
        notes=order.notes,
        ordered_at=order.ordered_at,
        sale_for=order.sale_for,
        client={"id": order.client.id, "name": order.client.name, "rif": order.client.rif, "address": order.client.address}
        if order.client
        else None,
        lines_count=len(order.lines),
        active_work_orders_count=active_count,
        first_line_with_product=_first_line_with_product(order),
        lines=[ClientOrderLineRead.from_orm_line(line) for line in order.lines] if include_lines else None,
    )
    return data


def _apply_lines(order: ClientOrder, lines_data: list, db: Session) -> None:
    order.lines.clear()
    for item in lines_data:
        line = ClientOrderLine(
            product_id=item.product_id,
            material_id=item.material_id,
            quantity=Decimal(str(item.quantity)),
            unit=item.unit,
            description=item.description,
            notes=item.notes,
        )
        if item.product_id:
            line.product = db.get(Product, item.product_id)
        order.lines.append(line)


@router.get("/client-orders", response_model=PaginatedClientOrders)
def list_client_orders(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    client_id: int | None = None,
    status: str | None = None,
    awaiting_ot: int | None = None,
    batch_id: int | None = None,
    sort: str | None = None,
) -> PaginatedClientOrders:
    query = db.query(ClientOrder).options(
        joinedload(ClientOrder.client),
        joinedload(ClientOrder.batch),
        joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
        joinedload(ClientOrder.work_orders),
    )
    if client_id:
        query = query.filter(ClientOrder.client_id == client_id)
    if batch_id:
        query = query.filter(ClientOrder.batch_id == batch_id)
    if status:
        query = query.filter(ClientOrder.status == status)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(ClientOrder.code.ilike(term) | ClientOrder.notes.ilike(term))
    if awaiting_ot:
        scheduled_ids = db.query(WorkOrder.client_order_id).distinct()
        query = query.filter(~ClientOrder.id.in_(scheduled_ids))
    order_col = ClientOrder.id.asc() if sort == "asc" else ClientOrder.id.desc()
    query = query.order_by(order_col)
    return PaginatedClientOrders(**paginate(query, page, per_page, lambda o: _to_read(o)))


@router.get("/client-orders/{order_id}/history", response_model=ClientOrderHistoryRead)
def get_client_order_history(order_id: int, db: Annotated[Session, Depends(get_db)]) -> ClientOrderHistoryRead:
    order = db.get(ClientOrder, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return ClientOrderHistoryRead(**build_client_order_history(db, order_id))


@router.get("/client-orders/{order_id}", response_model=ClientOrderRead)
def get_client_order(order_id: int, db: Annotated[Session, Depends(get_db)]) -> ClientOrderRead:
    order = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.batch),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
            joinedload(ClientOrder.work_orders),
        )
        .filter(ClientOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return _to_read(order, include_lines=True)


@router.post("/client-orders", response_model=ClientOrderRead, status_code=201)
def create_client_order(
    payload: ClientOrderCreate,
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderRead:
    client = db.get(Client, payload.client_id)
    if not client:
        raise HTTPException(status_code=422, detail={"message": "Cliente no válido", "errors": {"client_id": ["No existe"]}})

    if payload.batch_id:
        batch = db.get(ProductionBatch, payload.batch_id)
        if not batch:
            raise HTTPException(status_code=422, detail="N OP no valido")
        try:
            order = add_order_to_batch(
                db,
                batch,
                client_id=payload.client_id,
                ordered_at=parse_date(payload.ordered_at),
                sale_for=payload.sale_for,
                notes=payload.notes,
                lines_data=payload.lines,
            )
            db.commit()
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        order = (
            db.query(ClientOrder)
            .options(
                joinedload(ClientOrder.client),
                joinedload(ClientOrder.batch),
                joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
                joinedload(ClientOrder.work_orders),
            )
            .filter(ClientOrder.id == order.id)
            .first()
        )
        return _to_read(order, include_lines=True)

    code = payload.code
    if not code:
        existing = [row[0] for row in db.query(ClientOrder.code).all()]
        code = next_code("OP-", existing)
    if db.query(ClientOrder).filter(ClientOrder.code == code).first():
        raise HTTPException(status_code=409, detail="Código de orden ya existe")
    order = ClientOrder(
        client_id=payload.client_id,
        code=code,
        status=payload.status or "open",
        notes=payload.notes,
        ordered_at=parse_date(payload.ordered_at) or date.today(),
        sale_for=payload.sale_for,
    )
    if payload.lines:
        _apply_lines(order, payload.lines, db)
    db.add(order)
    db.flush()
    ensure_batch_for_order(db, order, code)
    db.commit()
    db.refresh(order)
    order = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.batch),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
            joinedload(ClientOrder.work_orders),
        )
        .filter(ClientOrder.id == order.id)
        .first()
    )
    return _to_read(order, include_lines=True)


@router.patch("/client-orders/{order_id}", response_model=ClientOrderRead)
def update_client_order(
    order_id: int,
    payload: ClientOrderUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderRead:
    order = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.batch),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
            joinedload(ClientOrder.work_orders),
        )
        .filter(ClientOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    data = payload.model_dump(exclude_unset=True)
    lines = data.pop("lines", None)
    if "ordered_at" in data:
        data["ordered_at"] = parse_date(data["ordered_at"])
    for key, value in data.items():
        setattr(order, key, value)
    if lines is not None:
        _apply_lines(order, lines, db)
    db.commit()
    db.refresh(order)
    return _to_read(order, include_lines=True)
