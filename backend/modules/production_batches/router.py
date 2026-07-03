from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from modules.production.models import ClientOrder, ClientOrderLine, ProductionBatch
from modules.production_batches.schemas import (
    ProductionBatchAddOrderInput,
    ProductionBatchCreate,
    ProductionBatchRead,
)
from modules.production_batches.service import add_order_to_batch, create_batch_with_order
from modules.production.helpers import parse_date

router = APIRouter(tags=["production-batches"])


def _batch_read(batch: ProductionBatch) -> ProductionBatchRead:
    from modules.client_orders.router import _to_read

    orders = [_to_read(order, include_lines=True) for order in batch.client_orders]
    return ProductionBatchRead(
        id=batch.id,
        code=batch.code,
        notes=batch.notes,
        created_at=batch.created_at.date() if batch.created_at else None,
        orders=orders,
    )


def _load_batch(db: Session, batch_id: int) -> ProductionBatch:
    batch = (
        db.query(ProductionBatch)
        .options(
            joinedload(ProductionBatch.client_orders)
            .joinedload(ClientOrder.client),
            joinedload(ProductionBatch.client_orders)
            .joinedload(ClientOrder.lines)
            .joinedload(ClientOrderLine.product),
            joinedload(ProductionBatch.client_orders).joinedload(ClientOrder.work_orders),
        )
        .filter(ProductionBatch.id == batch_id)
        .first()
    )
    if not batch:
        raise HTTPException(status_code=404, detail="N OP no encontrado")
    return batch


@router.post("/production-batches", response_model=ProductionBatchRead, status_code=201)
def create_production_batch(
    payload: ProductionBatchCreate,
    db: Annotated[Session, Depends(get_db)],
) -> ProductionBatchRead:
    try:
        batch = create_batch_with_order(
            db,
            client_id=payload.client_id,
            code=payload.code,
            batch_notes=payload.notes,
            ordered_at=parse_date(payload.ordered_at),
            sale_for=payload.sale_for,
            order_notes=payload.order_notes,
            lines_data=payload.lines,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _batch_read(_load_batch(db, batch.id))


@router.get("/production-batches/{batch_id}", response_model=ProductionBatchRead)
def get_production_batch(
    batch_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> ProductionBatchRead:
    return _batch_read(_load_batch(db, batch_id))


@router.post("/production-batches/{batch_id}/orders", response_model=ProductionBatchRead)
def add_production_batch_order(
    batch_id: int,
    payload: ProductionBatchAddOrderInput,
    db: Annotated[Session, Depends(get_db)],
) -> ProductionBatchRead:
    batch = _load_batch(db, batch_id)
    try:
        add_order_to_batch(
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
    return _batch_read(_load_batch(db, batch_id))
