from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from modules.production.models import PurchaseOrder, PurchaseOrderLine, PurchaseReceipt, Supplier
from modules.purchase_orders.code import allocate_po_code, peek_po_code
from modules.purchase_orders.schemas import (
    PaginatedPurchaseOrders,
    PurchaseOrderCreate,
    PurchaseOrderLineCreate,
    PurchaseOrderRead,
    PurchaseOrderUpdate,
)

router = APIRouter(tags=["purchase-orders"])


def _order_query(db: Session):
    return db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.lines),
    )


def _receipt_stats_by_po(db: Session, po_ids: list[int]) -> dict[int, tuple[int, object]]:
    if not po_ids:
        return {}
    rows = (
        db.query(
            PurchaseReceipt.purchase_order_id,
            func.count(PurchaseReceipt.id),
            func.max(PurchaseReceipt.received_at),
        )
        .filter(PurchaseReceipt.purchase_order_id.in_(po_ids))
        .group_by(PurchaseReceipt.purchase_order_id)
        .all()
    )
    return {
        int(po_id): (int(count), last_at)
        for po_id, count, last_at in rows
        if po_id is not None
    }


def _progress_label(order: PurchaseOrder) -> str:
    if not order.lines:
        return "—"
    ordered = sum((line.quantity_ordered or Decimal(0)) for line in order.lines)
    received = sum((line.quantity_received or Decimal(0)) for line in order.lines)
    if ordered <= 0:
        return "—"
    return f"{received.normalize()} / {ordered.normalize()}"


def _serialize_order(
    order: PurchaseOrder,
    receipt_stats: dict[int, tuple[int, object]] | None = None,
) -> PurchaseOrderRead:
    receipts_count = 0
    last_receipt_at = None
    if receipt_stats and order.id in receipt_stats:
        receipts_count, last_receipt_at = receipt_stats[order.id]
    data = PurchaseOrderRead.model_validate(order)
    return data.model_copy(
        update={
            "lines_count": len(order.lines),
            "receipts_count": receipts_count,
            "last_receipt_at": last_receipt_at,
            "receipt_progress_label": _progress_label(order),
        }
    )


def _replace_lines(order: PurchaseOrder, lines: list[PurchaseOrderLineCreate]) -> None:
    existing_by_id = {line.id: line for line in order.lines if line.id}
    order.lines.clear()
    for line in lines:
        prev_received = Decimal(0)
        if line.id and line.id in existing_by_id:
            prev_received = existing_by_id[line.id].quantity_received or Decimal(0)
        order.lines.append(
            PurchaseOrderLine(
                material_id=line.material_id,
                description=line.description,
                quantity_ordered=line.quantity_ordered,
                quantity_received=prev_received,
                unit=line.unit,
                unit_price=line.unit_price,
            )
        )


def _validate_supplier(db: Session, supplier_id: int) -> None:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(
            status_code=422,
            detail={"message": "Datos inválidos", "errors": {"supplier_id": ["Proveedor no encontrado"]}},
        )
    if not supplier.active:
        raise HTTPException(
            status_code=422,
            detail={"message": "Datos inválidos", "errors": {"supplier_id": ["El proveedor está inactivo"]}},
        )


def _validate_lines(lines: list[PurchaseOrderLineCreate]) -> None:
    valid = [line for line in lines if (line.quantity_ordered or Decimal(0)) > 0]
    if not valid:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"lines": ["Agregue al menos una línea con cantidad."]},
            },
        )


def _validate_change_reason(change_reason: str | None) -> None:
    if len((change_reason or "").strip()) < 5:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"change_reason": ["Indique el motivo del cambio (mín. 5 caracteres)."]},
            },
        )


def _receipt_count(db: Session, order_id: int) -> int:
    return (
        db.query(func.count(PurchaseReceipt.id))
        .filter(PurchaseReceipt.purchase_order_id == order_id)
        .scalar()
        or 0
    )


@router.get("/purchase-orders/next-code")
def next_purchase_order_code(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    return {"code": peek_po_code(db)}


@router.get("/purchase-orders", response_model=PaginatedPurchaseOrders)
def list_purchase_orders(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    supplier_id: int | None = None,
    status: str | None = None,
    has_receipts: int | None = Query(None, ge=0, le=1),
    visibility: str = Query("active"),
) -> PaginatedPurchaseOrders:
    query = _order_query(db)
    if visibility == "active":
        query = query.filter(PurchaseOrder.is_active.is_(True))
    elif visibility == "inactive":
        query = query.filter(PurchaseOrder.is_active.is_(False))
    if supplier_id is not None:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    if q:
        query = query.filter(PurchaseOrder.code.ilike(f"%{q.strip()}%"))
    if has_receipts is not None:
        if has_receipts:
            query = query.filter(PurchaseOrder.status.in_(["partial", "completed"]))
        else:
            query = query.filter(PurchaseOrder.status == "open")
    query = query.order_by(PurchaseOrder.id.desc())

    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    receipt_stats = _receipt_stats_by_po(db, [item.id for item in items])
    last_page = max(1, (total + per_page - 1) // per_page)
    from_ = (page - 1) * per_page + 1 if total > 0 else None
    to = min(page * per_page, total) if total > 0 else None

    return PaginatedPurchaseOrders(
        data=[_serialize_order(item, receipt_stats) for item in items],
        total=total,
        current_page=page,
        per_page=per_page,
        last_page=last_page,
        from_=from_,
        to=to,
    )


@router.get("/purchase-orders/{order_id}", response_model=PurchaseOrderRead)
def get_purchase_order(order_id: int, db: Annotated[Session, Depends(get_db)]) -> PurchaseOrderRead:
    order = _order_query(db).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")
    receipt_stats = _receipt_stats_by_po(db, [order.id])
    return _serialize_order(order, receipt_stats)


@router.post("/purchase-orders", response_model=PurchaseOrderRead, status_code=201)
def create_purchase_order(
    payload: PurchaseOrderCreate,
    db: Annotated[Session, Depends(get_db)],
) -> PurchaseOrderRead:
    _validate_supplier(db, payload.supplier_id)
    _validate_lines(payload.lines)
    code = payload.code.strip()
    if not code or db.query(PurchaseOrder).filter(PurchaseOrder.code == code).first():
        code = allocate_po_code(db)
    data = payload.model_dump(exclude={"lines"})
    data["code"] = code
    order = PurchaseOrder(**data, status="open")
    _replace_lines(order, payload.lines)
    db.add(order)
    db.commit()
    order = _order_query(db).filter(PurchaseOrder.id == order.id).first()
    receipt_stats = _receipt_stats_by_po(db, [order.id])
    return _serialize_order(order, receipt_stats)


@router.patch("/purchase-orders/{order_id}", response_model=PurchaseOrderRead)
def update_purchase_order(
    order_id: int,
    payload: PurchaseOrderUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> PurchaseOrderRead:
    order = _order_query(db).filter(PurchaseOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden de compra no encontrada")

    receipts = _receipt_count(db, order_id)
    if receipts > 0 and payload.lines is not None:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"lines": ["No se pueden modificar líneas con recepciones registradas"]},
            },
        )

    _validate_change_reason(payload.change_reason)
    if payload.lines is not None:
        _validate_lines(payload.lines)

    data = payload.model_dump(exclude_unset=True, exclude={"lines", "change_reason"})
    if "supplier_id" in data and data["supplier_id"] is not None:
        _validate_supplier(db, int(data["supplier_id"]))
    for key, value in data.items():
        setattr(order, key, value)
    if payload.lines is not None:
        _replace_lines(order, payload.lines)
    order.change_reason = payload.change_reason.strip()
    db.commit()
    order = _order_query(db).filter(PurchaseOrder.id == order_id).first()
    receipt_stats = _receipt_stats_by_po(db, [order_id])
    return _serialize_order(order, receipt_stats)
