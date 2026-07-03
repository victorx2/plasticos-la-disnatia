from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from modules.extrusion_runs.service import extrusion_production_filter_many, production_work_order_id

from modules.production.models import (
    ClientOrder,
    ExtrusionCoil,
    ExtrusionRun,
    ExtrusionShiftSegment,
    MaterialRequest,
    WorkOrder,
)
from modules.production.models import ClientOrderLine


def try_fulfill_client_order(db: Session, client_order_id: int) -> None:
    order = db.get(ClientOrder, client_order_id)
    if not order or order.status != "open":
        return
    work_orders = (
        db.query(WorkOrder)
        .filter(WorkOrder.client_order_id == client_order_id, WorkOrder.status != "cancelled")
        .all()
    )
    if not work_orders:
        return
    if all(wo.status == "fulfilled" or wo.board_stage == "completada" for wo in work_orders):
        order.status = "fulfilled"


def build_client_order_history(db: Session, order_id: int) -> dict:
    order = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
            joinedload(ClientOrder.work_orders),
        )
        .filter(ClientOrder.id == order_id)
        .first()
    )
    if not order:
        return {}

    work_orders = (
        db.query(WorkOrder)
        .filter(WorkOrder.client_order_id == order_id)
        .order_by(WorkOrder.id.asc())
        .all()
    )
    wo_ids = [wo.id for wo in work_orders]

    material_requests = []
    if wo_ids:
        requests = (
            db.query(MaterialRequest)
            .options(joinedload(MaterialRequest.lines))
            .filter(MaterialRequest.work_order_id.in_(wo_ids))
            .order_by(MaterialRequest.created_at.asc())
            .all()
        )
        for req in requests:
            material_requests.append(
                {
                    "id": req.id,
                    "work_order_id": req.work_order_id,
                    "flow": getattr(req, "request_flow", "outbound") or "outbound",
                    "status": req.status,
                    "kg_authorized": str(req.kg_authorized or 0),
                    "kg_dispatched": str(req.kg_dispatched or 0),
                    "kg_remaining": str(req.kg_remaining or 0),
                    "created_at": req.created_at.isoformat() if req.created_at else None,
                    "lines": [
                        {
                            "description": line.description,
                            "quantity_requested": str(line.quantity_requested),
                            "quantity_dispatched": str(line.quantity_dispatched),
                            "unit": line.unit,
                        }
                        for line in req.lines
                    ],
                }
            )

    extrusion_runs = []
    if wo_ids:
        runs = (
            db.query(ExtrusionRun)
            .options(joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.coils))
            .filter(extrusion_production_filter_many(wo_ids))
            .order_by(ExtrusionRun.id.asc())
            .all()
        )
        for run in runs:
            segments = []
            for seg in run.segments:
                segments.append(
                    {
                        "shift": seg.shift,
                        "machine": seg.machine,
                        "total_kg": str(seg.total_kg or 0),
                        "bolsones_kg": str(seg.bolsones_kg or 0),
                        "coils_count": len(seg.coils),
                        "started_at": seg.started_at.isoformat() if seg.started_at else None,
                        "ended_at": seg.ended_at.isoformat() if seg.ended_at else None,
                    }
                )
            coils_total = sum((c.kg or 0 for c in run.coils), start=0)
            extrusion_runs.append(
                {
                    "id": run.id,
                    "work_order_id": production_work_order_id(run),
                    "mixture_source_work_order_id": run.mixture_source_work_order_id or run.work_order_id,
                    "reassigned_work_order_id": run.reassigned_work_order_id,
                    "status": run.status,
                    "total_kg": str(run.total_kg or 0),
                    "coils_count": len(run.coils),
                    "coils_kg_total": str(coils_total),
                    "started_at": run.started_at.isoformat() if run.started_at else None,
                    "ended_at": run.ended_at.isoformat() if run.ended_at else None,
                    "segments": segments,
                }
            )

    dispatched_coils = 0
    pending_coils = 0
    if wo_ids:
        coils = (
            db.query(ExtrusionCoil)
            .join(ExtrusionRun, ExtrusionCoil.extrusion_run_id == ExtrusionRun.id)
            .filter(extrusion_production_filter_many(wo_ids))
            .all()
        )
        for coil in coils:
            if coil.pallet_id:
                dispatched_coils += 1
            else:
                pending_coils += 1

    started_at = order.ordered_at
    ended_at = None
    for run in extrusion_runs:
        if run.get("ended_at"):
            ended_at = run["ended_at"]
    if not ended_at and order.status == "fulfilled":
        for wo in work_orders:
            if wo.updated_at:
                ended_at = wo.updated_at.isoformat()

    duration_hours = None
    if started_at and ended_at:
        try:
            start_dt = datetime.combine(started_at, datetime.min.time())
            end_dt = datetime.fromisoformat(ended_at.replace("Z", "+00:00"))
            if end_dt.tzinfo:
                start_dt = start_dt.replace(tzinfo=end_dt.tzinfo)
            delta = end_dt - start_dt
            duration_hours = str(round(delta.total_seconds() / 3600, 2))
        except (TypeError, ValueError):
            duration_hours = None

    return {
        "order": {
            "id": order.id,
            "code": order.code,
            "status": order.status,
            "client_name": order.client.name if order.client else None,
            "ordered_at": order.ordered_at.isoformat() if order.ordered_at else None,
            "lines": [
                {
                    "product_name": line.product.name if line.product else line.description,
                    "quantity": str(line.quantity),
                    "unit": line.unit,
                }
                for line in order.lines
            ],
        },
        "work_orders": [
            {
                "id": wo.id,
                "code": wo.code,
                "status": wo.status,
                "board_stage": wo.board_stage,
                "quantity_kg": str(getattr(wo, "quantity_kg", "") or ""),
                "created_at": wo.created_at.isoformat() if wo.created_at else None,
            }
            for wo in work_orders
        ],
        "material_requests": material_requests,
        "extrusion_runs": extrusion_runs,
        "dispatch_summary": {
            "coils_dispatched": dispatched_coils,
            "coils_pending": pending_coils,
        },
        "timeline": {
            "started_at": started_at.isoformat() if started_at else None,
            "completed_at": ended_at,
            "duration_hours": duration_hours,
        },
    }
