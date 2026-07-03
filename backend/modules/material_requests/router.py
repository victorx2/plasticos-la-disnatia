from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database import get_db
from modules.material_requests.schemas import (
    MaterialRequestDispatchInput,
    MaterialRequestInput,
    MaterialRequestLineRead,
    MaterialRequestRead,
    MaterialRequestRejectInput,
)
from modules.production.helpers import parse_date, sum_kg_from_lines
from modules.production.models import (
    AreaRequest,
    MaterialRequest,
    MaterialRequestLine,
    WorkOrder,
)
from modules.materials.inventory_ops import add_stock, resolve_line_material, subtract_stock
from modules.materials.models import Material
from modules.tinta_mixtures.service import (
    create_submezcla_from_dispatch,
    find_principal_mezcla,
    first_open_request_pending_detail,
    get_principal_balance,
    recompute_principal_components,
    sync_mezcla_from_material_request,
    validate_follow_up_request,
)

router = APIRouter(tags=["material-requests"])


def _line_read(line: MaterialRequestLine) -> MaterialRequestLineRead:
    return MaterialRequestLineRead(
        id=line.id,
        material_id=line.material_id,
        description=line.description,
        quantity_requested=str(line.quantity_requested),
        quantity_dispatched=str(line.quantity_dispatched),
        unit=line.unit,
        material={"id": line.material.id, "sku": line.material.sku, "name": line.material.name, "unit": line.material.unit}
        if line.material
        else None,
    )


def _counter_lines_from_json(data: list | None) -> list[MaterialRequestLineRead]:
    if not data:
        return []
    return [
        MaterialRequestLineRead(
            material_id=row.get("material_id"),
            description=row.get("description"),
            quantity_requested=str(row.get("quantity_requested", "0")),
            unit=row.get("unit"),
        )
        for row in data
    ]


def _to_read(
    req: MaterialRequest,
    *,
    generated_mixture_id: int | None = None,
    principal_balance: dict | None = None,
) -> MaterialRequestRead:
    data = MaterialRequestRead(
        id=req.id,
        status=req.status,
        request_flow=getattr(req, "request_flow", None) or "outbound",
        originating_area=req.originating_area,
        destination_areas=req.destination_areas,
        notes=req.notes,
        document_date=req.document_date,
        authorized_by=req.authorized_by,
        work_order_id=req.work_order_id,
        work_order={"id": req.work_order.id, "code": req.work_order.code} if req.work_order else None,
        kg_authorized=str(req.kg_authorized) if req.kg_authorized is not None else None,
        kg_dispatched=str(req.kg_dispatched) if req.kg_dispatched is not None else None,
        kg_remaining=str(req.kg_remaining) if req.kg_remaining is not None else None,
        rejection_reason=req.rejection_reason,
        counter_proposal_lines=_counter_lines_from_json(req.counter_proposal_lines),
        lines=[_line_read(line) for line in req.lines],
        requester={"id": 1, "name": req.requester_name or "Operador"},
        created_at=req.created_at,
        generated_mixture_id=generated_mixture_id,
        principal_kg_remaining=principal_balance.get("kg_remaining") if principal_balance else None,
        is_replenishment=bool(getattr(req, "is_replenishment", False)),
    )
    return data


def _load_request(db: Session, request_id: int) -> MaterialRequest:
    req = (
        db.query(MaterialRequest)
        .options(
            joinedload(MaterialRequest.work_order),
            joinedload(MaterialRequest.lines).joinedload(MaterialRequestLine.material),
        )
        .filter(MaterialRequest.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    return req


def _sync_area_status(db: Session, req: MaterialRequest) -> None:
    area = db.query(AreaRequest).filter(AreaRequest.material_request_id == req.id).first()
    if not area:
        return
    if req.status in ("dispatched",):
        area.status = "done"
    elif req.status in ("rejected", "counter_rejected", "closed"):
        area.status = "cancelled" if req.status != "closed" else "done"
    elif req.status in ("counter_proposed",):
        area.status = "pending"
    else:
        area.status = "pending"


@router.get("/material-requests/by-work/{work_order_id}", response_model=MaterialRequestRead)
def get_material_request_by_work(
    work_order_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = (
        db.query(MaterialRequest)
        .options(
            joinedload(MaterialRequest.work_order),
            joinedload(MaterialRequest.lines).joinedload(MaterialRequestLine.material),
        )
        .filter(
            MaterialRequest.work_order_id == work_order_id,
            or_(MaterialRequest.request_flow == "outbound", MaterialRequest.request_flow.is_(None)),
        )
        .order_by(MaterialRequest.id.desc())
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Sin solicitud de insumos para este trabajo")
    return _to_read(req)


@router.get("/material-requests/{request_id}", response_model=MaterialRequestRead)
def get_material_request(request_id: int, db: Annotated[Session, Depends(get_db)]) -> MaterialRequestRead:
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests", response_model=MaterialRequestRead, status_code=201)
def create_material_request(
    payload: MaterialRequestInput,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    if payload.work_order_id:
        wo = db.get(WorkOrder, payload.work_order_id)
        if not wo:
            raise HTTPException(status_code=422, detail="Trabajo en planta no válido")
        principal = find_principal_mezcla(db, payload.work_order_id)
        if principal:
            recompute_principal_components(db, payload.work_order_id)
            db.flush()
            open_pending = first_open_request_pending_detail(db, payload.work_order_id)
            if open_pending:
                raise HTTPException(status_code=422, detail=open_pending[1])
            remaining = sum(Decimal(str(c.quantity)) for c in principal.components)
            if remaining <= 0 and not payload.allow_replenishment:
                raise HTTPException(
                    status_code=422,
                    detail="No quedan kg en la mezcla principal para este trabajo. "
                    "Active «Solicitud de reposición» si la mezcla se agotó o se usó en otra OP.",
                )
            if payload.allow_replenishment and remaining > Decimal("0.001"):
                raise HTTPException(
                    status_code=422,
                    detail="La reposición solo aplica cuando el cupo de mezcla principal está agotado.",
                )
        else:
            open_requests = (
                db.query(MaterialRequest)
                .filter(
                    MaterialRequest.work_order_id == payload.work_order_id,
                    MaterialRequest.status.notin_(["cancelled", "rejected", "dispatched", "closed"]),
                )
                .all()
            )
            for existing in open_requests:
                if existing.kg_remaining is not None and existing.kg_remaining <= 0:
                    raise HTTPException(
                        status_code=422,
                        detail="No quedan kg autorizados en solicitudes abiertas para este trabajo",
                    )
    lines = []
    for item in payload.lines:
        line = MaterialRequestLine(
            material_id=item.material_id,
            description=item.description,
            quantity_requested=Decimal(str(item.quantity_requested)),
            quantity_dispatched=Decimal("0"),
            unit=item.unit or "kg",
        )
        lines.append(line)
    kg_auth = sum_kg_from_lines(lines)
    req = MaterialRequest(
        status="pending",
        request_flow="outbound",
        is_replenishment=bool(payload.allow_replenishment),
        originating_area=payload.originating_area,
        destination_areas=payload.destination_areas or ["almacen"],
        notes=payload.notes,
        document_date=parse_date(payload.document_date) or date.today(),
        work_order_id=payload.work_order_id,
        kg_authorized=kg_auth,
        kg_dispatched=Decimal("0"),
        kg_remaining=kg_auth,
        requester_name="Operador",
        lines=lines,
    )
    db.add(req)
    db.flush()
    area = AreaRequest(
        area="almacen",
        title=f"Insumos solicitud #{req.id}",
        body=payload.notes,
        status="pending",
        material_request_id=req.id,
        work_order_id=payload.work_order_id,
        requester_name="Operador",
        insumos_origin="manual",
    )
    db.add(area)
    db.flush()
    principal = find_principal_mezcla(db, req.work_order_id) if req.work_order_id else None
    if principal and not payload.allow_replenishment:
        try:
            validate_follow_up_request(
                db, req.work_order_id, req.lines, exclude_request_id=req.id
            )
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        recompute_principal_components(db, req.work_order_id)
    elif principal and payload.allow_replenishment:
        pass
    else:
        sync_mezcla_from_material_request(db, req)
    db.commit()
    balance = get_principal_balance(db, req.work_order_id) if req.work_order_id else None
    return _to_read(
        _load_request(db, req.id),
        generated_mixture_id=None,
        principal_balance=balance,
    )


@router.post("/material-requests/{request_id}/authorize", response_model=MaterialRequestRead)
def authorize_material_request(
    request_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = _load_request(db, request_id)
    if req.status in ("rejected", "cancelled", "counter_proposed"):
        raise HTTPException(status_code=422, detail="No se puede autorizar en este estado")
    req.authorized_by = 1
    if req.status == "pending":
        req.status = "authorized"
    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests/{request_id}/dispatch", response_model=MaterialRequestRead)
def dispatch_material_request(
    request_id: int,
    payload: MaterialRequestDispatchInput,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = _load_request(db, request_id)
    if req.status in ("rejected", "cancelled", "counter_proposed", "dispatched", "closed"):
        raise HTTPException(status_code=422, detail="No se puede despachar en este estado")
    if getattr(req, "request_flow", "outbound") == "inbound":
        raise HTTPException(
            status_code=422,
            detail="Esta solicitud es de entrada a almacén. Use recibir.",
        )
    if req.authorized_by is None:
        req.authorized_by = 1
    dispatched_kg = Decimal("0")
    dispatched_batch: list[tuple[MaterialRequestLine, Decimal]] = []
    for item in payload.lines:
        line = next((ln for ln in req.lines if ln.id == item.material_request_line_id), None)
        if not line:
            raise HTTPException(status_code=422, detail="Línea no encontrada")
        qty = Decimal(str(item.quantity))
        pending = line.quantity_requested - line.quantity_dispatched
        if qty > pending + Decimal("0.0001"):
            raise HTTPException(status_code=422, detail="Cantidad supera lo pendiente")
        line.quantity_dispatched += qty
        if qty > 0:
            dispatched_batch.append((line, qty))
        unit = (line.unit or "kg").lower()
        if unit == "kg":
            dispatched_kg += qty
        if qty > 0:
            material = resolve_line_material(db, line, item.material_id)
            if not material:
                raise HTTPException(
                    status_code=422,
                    detail=f"No se encontró material de inventario para la línea: {line.description or line.id}",
                )
            try:
                subtract_stock(
                    db,
                    material,
                    qty,
                    reference_type="material_request",
                    reference_id=req.id,
                    reason=f"Despacho solicitud #{req.id}",
                )
            except ValueError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    req.kg_dispatched = (req.kg_dispatched or Decimal("0")) + dispatched_kg
    req.kg_remaining = max(Decimal("0"), (req.kg_authorized or Decimal("0")) - req.kg_dispatched)
    all_done = all(ln.quantity_dispatched >= ln.quantity_requested for ln in req.lines)
    is_partial = not all_done
    req.status = "dispatched" if all_done else "partial"
    _sync_area_status(db, req)

    mixture = create_submezcla_from_dispatch(
        db, req, dispatched_batch, is_partial=is_partial
    )
    if req.work_order_id:
        recompute_principal_components(db, req.work_order_id)
    db.commit()
    balance = get_principal_balance(db, req.work_order_id) if req.work_order_id else None
    return _to_read(
        _load_request(db, request_id),
        generated_mixture_id=mixture.id if mixture else None,
        principal_balance=balance,
    )


@router.post("/material-requests/{request_id}/reject", response_model=MaterialRequestRead)
def reject_material_request(
    request_id: int,
    payload: MaterialRequestRejectInput,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = _load_request(db, request_id)
    if req.status in ("dispatched", "cancelled"):
        raise HTTPException(status_code=422, detail="No se puede rechazar en este estado")
    req.rejection_reason = payload.reason.strip()
    if payload.counter_lines:
        req.counter_proposal_lines = [
            {
                "material_id": ln.material_id,
                "description": ln.description,
                "quantity_requested": str(ln.quantity_requested),
                "unit": ln.unit or "kg",
            }
            for ln in payload.counter_lines
        ]
        req.status = "counter_proposed"
    else:
        req.status = "rejected"
    _sync_area_status(db, req)
    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests/{request_id}/accept-counter", response_model=MaterialRequestRead)
def accept_material_request_counter(
    request_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = _load_request(db, request_id)
    if req.status != "counter_proposed" or not req.counter_proposal_lines:
        raise HTTPException(status_code=422, detail="No hay contraoferta pendiente")
    req.lines.clear()
    for row in req.counter_proposal_lines:
        req.lines.append(
            MaterialRequestLine(
                material_id=row.get("material_id"),
                description=row.get("description"),
                quantity_requested=Decimal(str(row.get("quantity_requested", "0"))),
                quantity_dispatched=Decimal("0"),
                unit=row.get("unit") or "kg",
            )
        )
    kg_auth = sum_kg_from_lines(req.lines)
    req.kg_authorized = kg_auth
    req.kg_dispatched = Decimal("0")
    req.kg_remaining = kg_auth
    req.counter_proposal_lines = None
    req.rejection_reason = None
    req.status = "pending"
    req.authorized_by = None
    sync_mezcla_from_material_request(db, req)
    _sync_area_status(db, req)
    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests/{request_id}/reject-counter", response_model=MaterialRequestRead)
def reject_material_request_counter(
    request_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    req = _load_request(db, request_id)
    if req.status != "counter_proposed":
        raise HTTPException(status_code=422, detail="No hay contraoferta pendiente")
    req.status = "counter_rejected"
    _sync_area_status(db, req)
    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests/{request_id}/receive", response_model=MaterialRequestRead)
def receive_material_request(
    request_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    """Almacén confirma recepción de producción (entrada desde planta)."""
    req = _load_request(db, request_id)
    if getattr(req, "request_flow", "outbound") != "inbound":
        raise HTTPException(status_code=422, detail="Esta solicitud no es de entrada a almacén")
    if req.status in ("dispatched", "cancelled", "rejected"):
        raise HTTPException(status_code=422, detail="No se puede recibir en este estado")
    for line in req.lines:
        line.quantity_dispatched = line.quantity_requested
        material = resolve_line_material(db, line, None)
        if material:
            add_stock(
                db,
                material,
                line.quantity_dispatched,
                movement_type="production_inbound",
                reference_type="material_request",
                reference_id=req.id,
                reason=f"Recepción producción solicitud #{req.id}",
            )
    req.kg_dispatched = req.kg_authorized or Decimal("0")
    req.kg_remaining = Decimal("0")
    req.status = "dispatched"
    req.authorized_by = req.authorized_by or 1
    _sync_area_status(db, req)
    db.commit()
    return _to_read(_load_request(db, request_id))


@router.post("/material-requests/{request_id}/close", response_model=MaterialRequestRead)
def close_material_request(
    request_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRequestRead:
    """Cierra manualmente una solicitud abierta (parcial o autorizada)."""
    req = _load_request(db, request_id)
    if getattr(req, "request_flow", "outbound") == "inbound":
        raise HTTPException(status_code=422, detail="No se puede cerrar una solicitud de entrada")
    if req.status in ("rejected", "cancelled", "dispatched", "closed", "counter_proposed"):
        raise HTTPException(status_code=422, detail="No se puede cerrar en este estado")
    req.status = "closed"
    _sync_area_status(db, req)
    db.commit()
    return _to_read(_load_request(db, request_id))
