from datetime import date, datetime
from decimal import Decimal
from typing import Annotated
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from modules.production.models import (
    ClientOrder,
    ClientOrderLine,
    ExtrusionCoil,
    ExtrusionRun,
    ExtrusionShiftSegment,
    ExtrusionWaste,
    TintaMixture,
    TintaMixtureComponent,
    WorkOrder,
)
from modules.extrusion_runs.service import extrusion_production_filter, extrusion_production_filter_many
from modules.reports.schemas import (
    ClientOrderLineReportRow,
    MixtureConsumptionByOrderRow,
    MixtureConsumptionRow,
    MixtureMaterialRow,
    ProductionGeneralRow,
    ProductionMachineOrderRow,
    ProductionMachineReportRow,
    ProductionMachineShiftRow,
    ProductionTimeRow,
    WasteByOrderRow,
    WasteConsolidatedRow,
)

router = APIRouter(tags=["reports"])


def _client_order_target_kg(order: ClientOrder) -> Decimal | None:
    total = Decimal("0")
    has_kg = False
    for line in order.lines:
        unit = (line.unit or "kg").strip().lower()
        if unit != "kg":
            continue
        total += Decimal(str(line.quantity or 0))
        has_kg = True
    return total if has_kg else None


def _client_order_line_rows(order: ClientOrder) -> list[ClientOrderLineReportRow]:
    wo_by_line: dict[int, WorkOrder] = {}
    for wo in order.work_orders:
        if wo.client_order_line_id:
            wo_by_line[wo.client_order_line_id] = wo

    rows: list[ClientOrderLineReportRow] = []
    for line in order.lines:
        unit = (line.unit or "kg").strip().lower()
        qty = Decimal(str(line.quantity or 0))
        target_kg = str(qty) if unit == "kg" else None
        wo = wo_by_line.get(line.id)
        product_name = None
        if wo and wo.product:
            product_name = wo.product.name
        elif line.product:
            product_name = line.product.name
        elif line.description:
            product_name = line.description
        rows.append(
            ClientOrderLineReportRow(
                line_id=line.id,
                work_order_id=wo.id if wo else None,
                work_order_code=wo.code if wo else None,
                product_name=product_name,
                quantity=str(qty),
                unit=line.unit or "kg",
                target_kg=target_kg,
            )
        )
    return rows


@router.get("/reports/production-times", response_model=list[ProductionTimeRow])
def production_times(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[ProductionTimeRow]:
    query = (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.client_order).joinedload(ClientOrder.client))
        .filter(WorkOrder.status != "cancelled")
    )
    if from_date:
        query = query.filter(WorkOrder.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(WorkOrder.created_at <= datetime.combine(to_date, datetime.max.time()))
    rows = query.order_by(WorkOrder.id.desc()).limit(100).all()
    result: list[ProductionTimeRow] = []
    for wo in rows:
        segment_minutes = (
            db.query(func.coalesce(func.sum(ExtrusionShiftSegment.effective_minutes), 0))
            .select_from(ExtrusionShiftSegment)
            .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
            .filter(extrusion_production_filter(wo.id))
            .scalar()
        )
        segment_count = (
            db.query(func.count(ExtrusionShiftSegment.id))
            .select_from(ExtrusionShiftSegment)
            .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
            .filter(extrusion_production_filter(wo.id))
            .scalar()
        ) or 0
        total_minutes = float(segment_minutes or 0)
        if total_minutes <= 0:
            run_minutes = (
                db.query(func.coalesce(func.sum(ExtrusionRun.total_effective_minutes), 0))
                .filter(
                    extrusion_production_filter(wo.id),
                    ExtrusionRun.status == "completed",
                )
                .scalar()
            )
            legacy_minutes = (
                db.query(func.coalesce(func.sum(ExtrusionRun.effective_minutes), 0))
                .filter(
                    extrusion_production_filter(wo.id),
                    ExtrusionRun.status == "completed",
                    ExtrusionRun.total_effective_minutes == 0,
                )
                .scalar()
            )
            total_minutes = float(run_minutes or 0) + float(legacy_minutes or 0)
        if total_minutes <= 0:
            continue
        result.append(
            ProductionTimeRow(
                work_order_id=wo.id,
                work_order_code=wo.code,
                client_name=wo.client_order.client.name if wo.client_order and wo.client_order.client else None,
                effective_minutes=str(round(total_minutes, 2)),
                segment_count=segment_count,
                effective_hours=str(round(total_minutes / 60, 2)),
                dead_hours="—",
                utilization_pct="—",
            )
        )
    return result


@router.get("/reports/mixture-consumption-total", response_model=list[MixtureConsumptionRow])
def mixture_consumption_total(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[MixtureConsumptionRow]:
    query = db.query(TintaMixture).options(joinedload(TintaMixture.components))
    if from_date:
        query = query.filter(TintaMixture.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(TintaMixture.created_at <= datetime.combine(to_date, datetime.max.time()))
    mixtures = query.all()
    totals: dict[str, tuple[str, Decimal]] = {}
    for mixture in mixtures:
        key = mixture.output_sku
        qty = sum((Decimal(str(c.quantity)) for c in mixture.components), Decimal("0"))
        if key in totals:
            totals[key] = (mixture.output_name, totals[key][1] + qty)
        else:
            totals[key] = (mixture.output_name, qty)
    return [
        MixtureConsumptionRow(output_sku=sku, output_name=name, total_kg=str(qty))
        for sku, (name, qty) in sorted(totals.items())
    ]


@router.get("/reports/mixture-consumption-by-order", response_model=list[MixtureConsumptionByOrderRow])
def mixture_consumption_by_order(
    db: Annotated[Session, Depends(get_db)],
    order_id: int | None = None,
) -> list[MixtureConsumptionByOrderRow]:
    query = (
        db.query(ClientOrder)
        .options(
            joinedload(ClientOrder.client),
            joinedload(ClientOrder.lines).joinedload(ClientOrderLine.product),
            joinedload(ClientOrder.work_orders).joinedload(WorkOrder.product),
        )
    )
    if order_id:
        query = query.filter(ClientOrder.id == order_id)
    orders = query.order_by(ClientOrder.id.desc()).limit(50).all()
    result = []
    for order in orders:
        work_ids = [wo.id for wo in order.work_orders]
        wo_ids = work_ids
        from modules.tinta_mixtures.service import (
            mixture_recipe_report_for_work_orders,
            mixture_usage_report_for_work_orders,
        )

        usage = mixture_usage_report_for_work_orders(db, wo_ids) if wo_ids else {
            "total_mixture_used_kg": "0",
            "mixture_sent_cross_kg": "0",
            "mixture_received_cross_kg": "0",
            "mixture_totals": [],
        }
        recipe = mixture_recipe_report_for_work_orders(db, wo_ids) if wo_ids else []
        produced = Decimal("0")
        produced_pending = Decimal("0")
        if wo_ids:
            produced = (
                db.query(func.coalesce(func.sum(ExtrusionRun.total_kg), 0))
                .filter(
                    extrusion_production_filter_many(wo_ids),
                    ExtrusionRun.status.in_(("completed", "in_progress")),
                )
                .scalar()
                or 0
            )
            produced_pending = (
                db.query(func.coalesce(func.sum(ExtrusionRun.total_kg), 0))
                .filter(extrusion_production_filter_many(wo_ids), ExtrusionRun.status == "in_progress")
                .scalar()
                or 0
            )
        first_product = None
        for wo in order.work_orders:
            if wo.product:
                first_product = wo.product.name
                break
        target_kg = _client_order_target_kg(order)
        produced_dec = Decimal(str(produced or 0))
        remaining_kg = (
            max(Decimal("0"), target_kg - produced_dec) if target_kg is not None else None
        )
        result.append(
            MixtureConsumptionByOrderRow(
                client_order_code=order.code,
                client_name=order.client.name if order.client else None,
                product_name=first_product,
                order_target_kg=str(target_kg) if target_kg is not None else None,
                kg_remaining=str(remaining_kg) if remaining_kg is not None else None,
                total_produced_kg=str(produced or 0),
                produced_kg_pending_close=str(produced_pending or 0),
                total_mixture_used_kg=str(usage["total_mixture_used_kg"]),
                mixture_received_cross_kg=str(usage["mixture_received_cross_kg"]),
                mixture_sent_cross_kg=str(usage["mixture_sent_cross_kg"]),
                mixture_totals=[
                    MixtureConsumptionRow(
                        output_sku=row["output_sku"],
                        output_name=row["output_name"],
                        total_kg=row["total_kg"],
                        components=[
                            MixtureMaterialRow(
                                material_sku=comp["material_sku"],
                                material_name=comp["material_name"],
                                total_kg=comp["total_kg"],
                            )
                            for comp in row.get("components") or []
                        ],
                    )
                    for row in usage["mixture_totals"]
                ],
                mixture_recipe=[
                    MixtureMaterialRow(
                        material_sku=row["material_sku"],
                        material_name=row["material_name"],
                        total_kg=row["total_kg"],
                    )
                    for row in recipe
                ],
                order_lines=_client_order_line_rows(order),
            )
        )
    return result


@router.get("/reports/production-general", response_model=list[ProductionGeneralRow])
def production_general(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[ProductionGeneralRow]:
    query = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.client),
            joinedload(WorkOrder.client_order),
        )
        .filter(WorkOrder.status != "cancelled")
    )
    if from_date:
        query = query.filter(WorkOrder.created_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(WorkOrder.created_at <= datetime.combine(to_date, datetime.max.time()))
    work_orders = query.order_by(WorkOrder.id.desc()).limit(100).all()
    result: list[ProductionGeneralRow] = []
    for wo in work_orders:
        runs = (
            db.query(ExtrusionRun)
            .filter(extrusion_production_filter(wo.id), ExtrusionRun.status == "completed")
            .all()
        )
        if not runs:
            continue
        run_ids = [r.id for r in runs]
        coil_count = (
            db.query(func.count(ExtrusionCoil.id))
            .filter(ExtrusionCoil.extrusion_run_id.in_(run_ids))
            .scalar()
            or 0
        )
        total_kg = sum((r.total_kg for r in runs), Decimal("0"))
        total_bolsones = sum(
            (getattr(r, "bolsones_kg", Decimal("0")) or Decimal("0") for r in runs),
            Decimal("0"),
        )
        order = wo.client_order
        result.append(
            ProductionGeneralRow(
                work_order_id=wo.id,
                work_order_code=wo.code,
                client_order_code=order.code if order else None,
                client_name=order.client.name if order and order.client else None,
                total_coils=int(coil_count),
                total_kg=str(total_kg),
                total_bolsones_kg=str(total_bolsones),
            )
        )
    return result


@router.get("/reports/waste-by-order", response_model=list[WasteByOrderRow])
def waste_by_order(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[WasteByOrderRow]:
    query = (
        db.query(ExtrusionWaste, ExtrusionRun, WorkOrder, ClientOrder)
        .join(ExtrusionRun, ExtrusionWaste.extrusion_run_id == ExtrusionRun.id)
        .join(WorkOrder, ExtrusionRun.work_order_id == WorkOrder.id)
        .join(ClientOrder, WorkOrder.client_order_id == ClientOrder.id)
    )
    if from_date:
        query = query.filter(ExtrusionRun.recorded_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(ExtrusionRun.recorded_at <= datetime.combine(to_date, datetime.max.time()))
    rows = query.all()
    totals: dict[str, dict] = {}
    for waste, _run, wo, order in rows:
        key = wo.code
        if key not in totals:
            totals[key] = {
                "client_order_code": order.code,
                "refil": Decimal("0"),
                "transparente": Decimal("0"),
            }
        waste_type = (waste.waste_type or "").lower()
        if waste_type == "refil":
            totals[key]["refil"] += waste.waste_kg
        elif waste_type == "transparente":
            totals[key]["transparente"] += waste.waste_kg
    result = []
    for work_code, data in sorted(totals.items()):
        refil = data["refil"]
        transparente = data["transparente"]
        result.append(
            WasteByOrderRow(
                client_order_code=data["client_order_code"],
                work_order_code=work_code,
                refil_kg=str(refil),
                transparente_kg=str(transparente),
                total_kg=str(refil + transparente),
            )
        )
    return result


@router.get("/reports/waste-consolidated", response_model=WasteConsolidatedRow)
def waste_consolidated(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> WasteConsolidatedRow:
    query = db.query(ExtrusionWaste).join(ExtrusionRun, ExtrusionWaste.extrusion_run_id == ExtrusionRun.id)
    if from_date:
        query = query.filter(ExtrusionRun.recorded_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(ExtrusionRun.recorded_at <= datetime.combine(to_date, datetime.max.time()))
    refil = Decimal("0")
    transparente = Decimal("0")
    for waste in query.all():
        waste_type = (waste.waste_type or "").lower()
        if waste_type == "refil":
            refil += waste.waste_kg
        elif waste_type == "transparente":
            transparente += waste.waste_kg
    return WasteConsolidatedRow(
        refil_kg=str(refil),
        transparente_kg=str(transparente),
        total_kg=str(refil + transparente),
    )


@router.get("/reports/production-by-machine", response_model=list[ProductionMachineReportRow])
def production_by_machine(
    db: Annotated[Session, Depends(get_db)],
    from_date: date | None = None,
    to_date: date | None = None,
) -> list[ProductionMachineReportRow]:
    query = (
        db.query(ExtrusionShiftSegment)
        .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionShiftSegment.coils),
            joinedload(ExtrusionShiftSegment.extrusion_run).joinedload(ExtrusionRun.work_order).joinedload(
                WorkOrder.client_order
            ),
        )
    )
    if from_date:
        query = query.filter(ExtrusionRun.recorded_at >= datetime.combine(from_date, datetime.min.time()))
    if to_date:
        query = query.filter(ExtrusionRun.recorded_at <= datetime.combine(to_date, datetime.max.time()))
    segments = query.all()

    machines: dict[str | None, dict] = defaultdict(
        lambda: {
            "total_kg": Decimal("0"),
            "coils_count": 0,
            "bolsones_kg": Decimal("0"),
            "shifts": defaultdict(
                lambda: {
                    "total_kg": Decimal("0"),
                    "coils_count": 0,
                    "bolsones_kg": Decimal("0"),
                    "orders": defaultdict(
                        lambda: {
                            "total_kg": Decimal("0"),
                            "coils_count": 0,
                            "bolsones_kg": Decimal("0"),
                            "work_order_code": "",
                            "client_order_code": None,
                        }
                    ),
                }
            ),
        }
    )

    for segment in segments:
        machine = segment.machine or "Sin línea"
        shift = segment.shift or "Sin turno"
        seg_kg = segment.total_kg or Decimal("0")
        seg_bolsones = segment.bolsones_kg or Decimal("0")
        seg_coils = len(segment.coils)
        run = segment.extrusion_run
        wo = run.work_order if run else None
        wo_id = wo.id if wo else 0

        m = machines[machine]
        m["total_kg"] += seg_kg
        m["coils_count"] += seg_coils
        m["bolsones_kg"] += seg_bolsones

        s = m["shifts"][shift]
        s["total_kg"] += seg_kg
        s["coils_count"] += seg_coils
        s["bolsones_kg"] += seg_bolsones

        o = s["orders"][wo_id]
        o["total_kg"] += seg_kg
        o["coils_count"] += seg_coils
        o["bolsones_kg"] += seg_bolsones
        if wo:
            o["work_order_code"] = wo.code
            o["client_order_code"] = wo.client_order.code if wo.client_order else None

    result: list[ProductionMachineReportRow] = []
    for machine, mdata in sorted(machines.items(), key=lambda x: (x[0] or "")):
        shifts_out: list[ProductionMachineShiftRow] = []
        for shift, sdata in sorted(mdata["shifts"].items(), key=lambda x: (x[0] or "")):
            orders_out = [
                ProductionMachineOrderRow(
                    work_order_id=wo_id,
                    work_order_code=odata["work_order_code"] or f"OT-{wo_id}",
                    client_order_code=odata["client_order_code"],
                    total_kg=str(odata["total_kg"]),
                    coils_count=odata["coils_count"],
                    bolsones_kg=str(odata["bolsones_kg"]),
                )
                for wo_id, odata in sorted(sdata["orders"].items())
                if wo_id > 0
            ]
            shifts_out.append(
                ProductionMachineShiftRow(
                    shift=shift,
                    total_kg=str(sdata["total_kg"]),
                    coils_count=sdata["coils_count"],
                    bolsones_kg=str(sdata["bolsones_kg"]),
                    orders=orders_out,
                )
            )
        result.append(
            ProductionMachineReportRow(
                machine=machine,
                total_kg=str(mdata["total_kg"]),
                coils_count=mdata["coils_count"],
                bolsones_kg=str(mdata["bolsones_kg"]),
                shifts=shifts_out,
            )
        )
    return result
