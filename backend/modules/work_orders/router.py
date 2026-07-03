from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from modules.client_orders.service import try_fulfill_client_order
from modules.production.helpers import (
    line_sequence,
    next_code,
    pending_order_lines,
    product_lines,
)
from modules.production.models import (
    AreaRequest,
    ClientOrder,
    ClientOrderLine,
    ExtrusionRun,
    MaterialRequest,
    WorkOrder,
)
from modules.work_orders.schemas import (
    ClientOrderLink,
    PendingClientOrderLineRead,
    ProgramacionBoardRead,
    WorkOrderCreate,
    WorkOrderRead,
    WorkOrderUpdate,
)

router = APIRouter(tags=["work-orders"])

BOARD_STAGES = ["nueva", "pendiente", "mezcla", "extrusion", "completada"]


def _to_work_order_read(wo: WorkOrder) -> WorkOrderRead:
    client = wo.client_order.client if wo.client_order else None
    line = wo.client_order_line
    return WorkOrderRead(
        id=wo.id,
        code=wo.code,
        document_date=wo.document_date,
        created_at=wo.created_at,
        status=wo.status,
        board_stage=wo.board_stage,
        scheduling_status=wo.scheduling_status,
        client={"id": client.id, "name": client.name} if client else None,
        product={"id": wo.product.id, "name": wo.product.name, "cpe": wo.product.cpe, "mps": wo.product.mps}
        if wo.product
        else None,
        client_order={
            "id": wo.client_order.id,
            "code": wo.client_order.code,
            "batch_code": wo.client_order.batch.code if wo.client_order.batch else None,
        }
        if wo.client_order
        else None,
        order_quantity=str(line.quantity) if line else None,
        order_unit=line.unit if line else None,
    )


@router.get("/work-orders/programacion-board", response_model=ProgramacionBoardRead)
def programacion_board(db: Annotated[Session, Depends(get_db)]) -> ProgramacionBoardRead:
    work_orders = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.client),
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.batch),
            joinedload(WorkOrder.client_order_line),
            joinedload(WorkOrder.product),
        )
        .filter(WorkOrder.status != "cancelled")
        .order_by(WorkOrder.id.desc())
        .all()
    )
    columns: dict[str, list[WorkOrderRead]] = {stage: [] for stage in BOARD_STAGES}
    for wo in work_orders:
        stage = wo.board_stage if wo.board_stage in columns else "nueva"
        columns[stage].append(_to_work_order_read(wo))

    active_extrusion_ids: set[int] = set()
    for origin_id, dest_id in (
        db.query(ExtrusionRun.work_order_id, ExtrusionRun.reassigned_work_order_id)
        .filter(ExtrusionRun.status == "in_progress")
        .all()
    ):
        active_extrusion_ids.add(origin_id)
        if dest_id:
            active_extrusion_ids.add(dest_id)

    pending_orders = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
        )
        .filter(ClientOrder.status == "open")
        .order_by(ClientOrder.id.desc())
        .all()
    )
    pending = []
    for order, line, seq in pending_order_lines(pending_orders, work_orders):
        client = order.client
        product = line.product
        pending.append(
            PendingClientOrderLineRead(
                line_id=line.id,
                client_order_id=order.id,
                order_code=order.code,
                line_seq=seq,
                quantity=str(line.quantity),
                unit=line.unit,
                client={"id": client.id, "name": client.name} if client else None,
                product={"id": product.id, "name": product.name, "cpe": product.cpe, "mps": product.mps}
                if product
                else None,
            )
        )
    return ProgramacionBoardRead(
        columns=columns,
        pending_lines=pending,
        active_extrusion_work_order_ids=sorted(active_extrusion_ids),
    )


@router.post("/work-orders", response_model=WorkOrderRead, status_code=201)
def create_work_order(payload: WorkOrderCreate, db: Annotated[Session, Depends(get_db)]) -> WorkOrderRead:
    order = (
        db.query(ClientOrder)
        .options(joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product))
        .filter(ClientOrder.id == payload.client_order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Orden de producción no encontrada")

    target_line: ClientOrderLine | None = None
    if payload.client_order_line_id is not None:
        target_line = next((line for line in order.lines if line.id == payload.client_order_line_id), None)
        if not target_line:
            raise HTTPException(status_code=400, detail="La línea no pertenece a esta orden")
        if not target_line.product_id:
            raise HTTPException(status_code=400, detail="La línea no tiene producto asignado")
        existing_for_line = (
            db.query(WorkOrder)
            .filter(WorkOrder.client_order_line_id == target_line.id)
            .first()
        )
        if existing_for_line:
            raise HTTPException(status_code=409, detail="Ya existe un trabajo en planta para esta línea")
    elif payload.import_client_order_lines:
        lines_with_product = product_lines(order)
        if not lines_with_product:
            raise HTTPException(status_code=400, detail="La orden no tiene líneas con producto")
        target_line = lines_with_product[0]
        existing_for_line = (
            db.query(WorkOrder)
            .filter(WorkOrder.client_order_line_id == target_line.id)
            .first()
        )
        legacy_wo = (
            db.query(WorkOrder)
            .filter(
                WorkOrder.client_order_id == order.id,
                WorkOrder.client_order_line_id.is_(None),
            )
            .first()
        )
        if existing_for_line or legacy_wo:
            raise HTTPException(status_code=409, detail="Ya existe un trabajo en planta para esta línea")

    existing_codes = [row[0] for row in db.query(WorkOrder.code).all()]
    product_id = target_line.product_id if target_line else None
    if target_line:
        seq = line_sequence(target_line, order)
        code = next_code(f"TP-{order.id}-{seq}-", existing_codes)
        client_order_line_id = target_line.id
    else:
        code = next_code(f"TP-{order.id}-", existing_codes)
        client_order_line_id = None

    wo = WorkOrder(
        client_order_id=order.id,
        client_order_line_id=client_order_line_id,
        code=code,
        status="open",
        board_stage=payload.board_stage or "nueva",
        scheduling_status="scheduled",
        document_date=order.ordered_at or date.today(),
        product_id=product_id,
    )
    db.add(wo)
    db.flush()
    if payload.auto_create_material_request:
        mr = MaterialRequest(
            status="pending",
            originating_area="produccion",
            destination_areas=["almacen"],
            notes=f"Solicitud automática para {code}",
            document_date=date.today(),
            work_order_id=wo.id,
            requester_name="Sistema",
        )
        db.add(mr)
        db.flush()
        ar = AreaRequest(
            area="almacen",
            title=f"Insumos trabajo {code}",
            body=mr.notes,
            status="pending",
            material_request_id=mr.id,
            work_order_id=wo.id,
            requester_name="Sistema",
            insumos_origin="ot_planilla",
        )
        db.add(ar)
    db.commit()
    db.refresh(wo)
    wo = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.client),
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.batch),
            joinedload(WorkOrder.product),
        )
        .filter(WorkOrder.id == wo.id)
        .first()
    )
    return _to_work_order_read(wo)


@router.patch("/work-orders/{work_order_id}", response_model=WorkOrderRead)
def update_work_order(
    work_order_id: int,
    payload: WorkOrderUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> WorkOrderRead:
    wo = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.client),
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.batch),
            joinedload(WorkOrder.product),
        )
        .filter(WorkOrder.id == work_order_id)
        .first()
    )
    if not wo:
        raise HTTPException(status_code=404, detail="Trabajo en planta no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(wo, key, value)
    if wo.board_stage == "completada":
        wo.status = "fulfilled"
        if wo.client_order_id:
            try_fulfill_client_order(db, wo.client_order_id)
    db.commit()
    db.refresh(wo)
    return _to_work_order_read(wo)
