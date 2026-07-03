from datetime import date
from decimal import Decimal
from typing import Annotated
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from modules.dispatch.schemas import (
    BobinaAvailableRead,
    BolsonesDispatchInput,
    BolsonesDispatchRead,
    BolsonesEntryInput,
    BolsonesEntryRead,
    BolsonesPendingRead,
    DesperdicioDispatchInput,
    DesperdicioDispatchRead,
    DesperdicioEntryInput,
    DesperdicioEntryRead,
    DesperdicioPendingRead,
    DispatchPalletBatchCreate,
    DispatchPalletCoilRead,
    DispatchPalletCreate,
    DispatchPalletListRead,
    DispatchPalletRead,
    FallasMaterialsAcceptInput,
    FallasMaterialsInput,
    FallasMaterialsRead,
    FallasPendingRead,
    SubproductInDispatchRead,
    SubproductReleaseInput,
    SubproductReleaseRead,
)
from modules.dispatch.service import (
    new_dispatch_batch_id,
    next_pallet_number_for_client,
    pallet_display_label,
)
from modules.extrusion_runs.service import extrusion_production_filter, production_work_order, production_work_order_id
from modules.production.helpers import next_code
from modules.production.models import (
    BolsonesDispatchShipment,
    BolsonesDispatchRelease,
    BolsonesManualEntry,
    ClientOrder,
    DesperdicioDispatchShipment,
    DesperdicioDispatchRelease,
    DesperdicioManualEntry,
    DispatchPallet,
    ExtrusionCoil,
    ExtrusionRun,
    ExtrusionShiftSegment,
    ExtrusionWaste,
    FallasMaterialsShipment,
    FallasManualEntry,
    InventoryReturn,
    SealingBobinaLine,
    SealingRun,
    TintaMixture,
    WorkOrder,
)

router = APIRouter(tags=["dispatch"])


def _work_order_measure(wo: WorkOrder | None) -> str | None:
    if not wo or not wo.product:
        return None
    structure = (wo.product.structure or "").strip()
    if structure:
        return structure
    name = (wo.product.name or "").strip()
    return name or None


def _bolsones_measure_for_work_order(db: Session, wo_id: int, wo: WorkOrder | None) -> str | None:
    measure = _work_order_measure(wo)
    if measure:
        return measure
    rows = (
        db.query(SealingBobinaLine.measure)
        .join(SealingRun, SealingBobinaLine.sealing_run_id == SealingRun.id)
        .filter(SealingRun.work_order_id == wo_id, SealingBobinaLine.measure.isnot(None))
        .distinct()
        .all()
    )
    measures = sorted({value.strip() for (value,) in rows if value and value.strip()})
    return " · ".join(measures) if measures else None


def _normalize_measure(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.strip().split())


def _measure_item_key(measure: str) -> str:
    return f"measure:{_normalize_measure(measure)}"


def _load_work_orders_map(db: Session, work_order_ids: set[int]) -> dict[int, WorkOrder]:
    if not work_order_ids:
        return {}
    work_orders = (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.product))
        .filter(WorkOrder.id.in_(work_order_ids))
        .all()
    )
    return {wo.id: wo for wo in work_orders}


def _bolsones_row_measure(
    db: Session,
    row: BolsonesDispatchShipment | BolsonesDispatchRelease,
    *,
    wo_map: dict[int, WorkOrder],
    manual_map: dict[int, BolsonesManualEntry],
) -> str:
    if row.measure and row.measure.strip():
        return _normalize_measure(row.measure)
    if row.manual_entry_id:
        entry = manual_map.get(row.manual_entry_id)
        if entry and entry.measure:
            return _normalize_measure(entry.measure)
        if entry and entry.description:
            return _normalize_measure(entry.description)
    if row.work_order_id:
        wo = wo_map.get(row.work_order_id)
        resolved = _bolsones_measure_for_work_order(db, row.work_order_id, wo)
        if resolved:
            return _normalize_measure(resolved)
    return ""


def _bolsones_movements_by_measure(
    db: Session,
    model: type[BolsonesDispatchShipment] | type[BolsonesDispatchRelease],
) -> dict[str, Decimal]:
    rows = db.query(model).all()
    wo_ids = {row.work_order_id for row in rows if row.work_order_id}
    manual_ids = {row.manual_entry_id for row in rows if row.manual_entry_id}
    wo_map = _load_work_orders_map(db, wo_ids)
    manual_map: dict[int, BolsonesManualEntry] = {}
    if manual_ids:
        entries = db.query(BolsonesManualEntry).filter(BolsonesManualEntry.id.in_(manual_ids)).all()
        manual_map = {entry.id: entry for entry in entries}
    totals: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for row in rows:
        measure = _bolsones_row_measure(db, row, wo_map=wo_map, manual_map=manual_map)
        if not measure:
            continue
        totals[measure] += row.kg or Decimal("0")
    return totals


def _bolsones_dispatched_by_measure(db: Session) -> dict[str, Decimal]:
    return _bolsones_movements_by_measure(db, BolsonesDispatchShipment)


def _bolsones_released_by_measure(db: Session) -> dict[str, Decimal]:
    return _bolsones_movements_by_measure(db, BolsonesDispatchRelease)


def _bolsones_pending_for_measure(db: Session, measure: str) -> Decimal:
    normalized = _normalize_measure(measure)
    for row in _bolsones_stock_by_measure(db):
        if _normalize_measure(row.measure) == normalized:
            return Decimal(str(row.pending_kg))
    return Decimal("0")


def _bolsones_in_dispatch_for_measure(db: Session, measure: str) -> Decimal:
    normalized = _normalize_measure(measure)
    shipped = _bolsones_dispatched_by_measure(db).get(normalized, Decimal("0"))
    released = _bolsones_released_by_measure(db).get(normalized, Decimal("0"))
    return shipped - released


def _bolsones_stock_by_measure(db: Session) -> list[BolsonesPendingRead]:
    produced_by_wo = _bolsones_produced_by_work_order(db)
    wo_map = _load_work_orders_map(db, set(produced_by_wo.keys()))

    production_by_measure: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for wo_id, kg in produced_by_wo.items():
        measure = _bolsones_measure_for_work_order(db, wo_id, wo_map.get(wo_id))
        if not measure:
            continue
        production_by_measure[_normalize_measure(measure)] += kg

    manual_by_measure: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    for entry in db.query(BolsonesManualEntry).all():
        measure = _normalize_measure(entry.measure or entry.description)
        if not measure:
            continue
        manual_by_measure[measure] += entry.kg or Decimal("0")

    dispatched_by_measure = _bolsones_dispatched_by_measure(db)
    measures = (
        set(production_by_measure.keys())
        | set(manual_by_measure.keys())
        | set(dispatched_by_measure.keys())
    )

    result: list[BolsonesPendingRead] = []
    for measure in sorted(measures):
        production_kg = production_by_measure.get(measure, Decimal("0"))
        manual_kg = manual_by_measure.get(measure, Decimal("0"))
        total = production_kg + manual_kg
        sent = dispatched_by_measure.get(measure, Decimal("0"))
        pending = total - sent
        if pending <= 0:
            continue
        if total <= 0 and sent <= 0:
            continue
        result.append(
            BolsonesPendingRead(
                item_key=_measure_item_key(measure),
                entry_kind="stock",
                measure=measure,
                produced_kg=str(total),
                production_kg=str(production_kg),
                manual_kg=str(manual_kg),
                dispatched_kg=str(sent),
                pending_kg=str(pending if pending > 0 else Decimal("0")),
            )
        )
    result.sort(key=lambda item: item.measure or "", reverse=True)
    return result


def _coil_work_order(coil: ExtrusionCoil):
    if not coil.extrusion_run:
        return None
    return production_work_order(coil.extrusion_run)


def _coil_work_order_code(coil: ExtrusionCoil) -> str | None:
    wo = _coil_work_order(coil)
    return wo.code if wo else None


def _coil_client_order_code(coil: ExtrusionCoil) -> str | None:
    wo = _coil_work_order(coil)
    if not wo or not wo.client_order:
        return None
    return wo.client_order.code


def _coil_shift(coil: ExtrusionCoil) -> str | None:
    if coil.dispatch_shift:
        return coil.dispatch_shift
    if coil.segment and coil.segment.shift:
        return coil.segment.shift
    if coil.extrusion_run and coil.extrusion_run.shift:
        return coil.extrusion_run.shift
    return None


def _pallet_to_read(pallet: DispatchPallet) -> DispatchPalletRead:
    coils = sorted(pallet.coils or [], key=lambda c: c.id)
    coil_reads = [
        DispatchPalletCoilRead(
            coil_id=coil.id,
            coil_code=coil.coil_code or str(coil.id),
            kg=str(coil.kg or 0),
            shift=_coil_shift(coil),
            client_order_code=_coil_client_order_code(coil),
            work_order_code=_coil_work_order_code(coil),
        )
        for coil in coils
    ]
    return DispatchPalletRead(
        id=pallet.id,
        code=pallet.code,
        pallet_number=pallet.pallet_number,
        display_label=pallet_display_label(pallet),
        dispatch_batch_id=pallet.dispatch_batch_id,
        total_kg=str(pallet.total_kg),
        client_name=pallet.client_name,
        destination=pallet.destination,
        notes=pallet.notes,
        product_name=pallet.product_name,
        measurements=pallet.measurements,
        coil_codes=[c.coil_code or str(c.id) for c in coils],
        coils=coil_reads,
        created_at=pallet.created_at,
    )


@router.get("/dispatch/bobinas-available", response_model=list[BobinaAvailableRead])
def bobinas_available(db: Annotated[Session, Depends(get_db)]) -> list[BobinaAvailableRead]:
    coils = (
        db.query(ExtrusionCoil)
        .options(
            joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.work_order)
            .joinedload(WorkOrder.client_order)
            .joinedload(ClientOrder.client),
            joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order)
            .joinedload(WorkOrder.client_order)
            .joinedload(ClientOrder.client),
            joinedload(ExtrusionCoil.segment),
        )
        .filter(ExtrusionCoil.pallet_id.is_(None))
        .order_by(ExtrusionCoil.id.desc())
        .all()
    )

    work_order_ids = []
    for coil in coils:
        wo = _coil_work_order(coil)
        if wo:
            work_order_ids.append(wo.id)
    tp_map = {}
    if work_order_ids:
        mixtures = db.query(TintaMixture.work_order_id, TintaMixture.output_sku).filter(
            TintaMixture.work_order_id.in_(work_order_ids)
        ).all()
        for wo_id, output_sku in mixtures:
            if wo_id and not tp_map.get(wo_id):
                tp_map[wo_id] = output_sku

    result: list[BobinaAvailableRead] = []
    for coil in coils:
        wo = _coil_work_order(coil)
        if wo and wo.production_route == "sealing":
            continue
        wo_id = wo.id if wo else None
        result.append(
            BobinaAvailableRead(
                id=coil.id,
                coil_code=coil.coil_code or f"BOB-{coil.id}",
                work_order_id=wo_id,
                client_order_code=wo.client_order.code if wo and wo.client_order else None,
                work_order_code=wo.code if wo else None,
                client_name=(
                    wo.client_order.client.name
                    if wo and wo.client_order and wo.client_order.client
                    else None
                ),
                tp_code=wo.code if wo else tp_map.get(wo_id) if wo_id else None,
                kg=str(coil.kg),
                shift=_coil_shift(coil),
                recorded_at=coil.extrusion_run.recorded_at if coil.extrusion_run else None,
            )
        )
    return result


def _bolsones_produced_by_work_order(db: Session) -> dict[int, Decimal]:
    produced = _extrusion_bolsones_produced_by_work_order(db)
    sealing = _sealing_bolsones_produced_by_work_order(db)
    for wo_id, kg in sealing.items():
        produced[wo_id] = produced.get(wo_id, Decimal("0")) + kg
    return produced


def _bolsones_production_only_by_work_order(db: Session) -> dict[int, Decimal]:
    produced = _extrusion_bolsones_produced_by_work_order(db)
    sealing = _sealing_bolsones_produced_by_work_order(db)
    for wo_id, kg in sealing.items():
        produced[wo_id] = produced.get(wo_id, Decimal("0")) + kg
    return produced


def _bolsones_dispatched_by_manual_entry(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            BolsonesDispatchShipment.manual_entry_id,
            func.coalesce(func.sum(BolsonesDispatchShipment.kg), 0),
        )
        .filter(BolsonesDispatchShipment.manual_entry_id.isnot(None))
        .group_by(BolsonesDispatchShipment.manual_entry_id)
        .all()
    )
    return {entry_id: Decimal(str(total or 0)) for entry_id, total in rows if entry_id}


def _bolsones_released_by_manual_entry(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            BolsonesDispatchRelease.manual_entry_id,
            func.coalesce(func.sum(BolsonesDispatchRelease.kg), 0),
        )
        .filter(BolsonesDispatchRelease.manual_entry_id.isnot(None))
        .group_by(BolsonesDispatchRelease.manual_entry_id)
        .all()
    )
    return {entry_id: Decimal(str(total or 0)) for entry_id, total in rows if entry_id}


def _desperdicio_dispatched_by_manual_entry(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            DesperdicioDispatchShipment.manual_entry_id,
            func.coalesce(func.sum(DesperdicioDispatchShipment.kg), 0),
        )
        .filter(DesperdicioDispatchShipment.manual_entry_id.isnot(None))
        .group_by(DesperdicioDispatchShipment.manual_entry_id)
        .all()
    )
    return {entry_id: Decimal(str(total or 0)) for entry_id, total in rows if entry_id}


def _desperdicio_released_by_manual_entry(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            DesperdicioDispatchRelease.manual_entry_id,
            func.coalesce(func.sum(DesperdicioDispatchRelease.kg), 0),
        )
        .filter(DesperdicioDispatchRelease.manual_entry_id.isnot(None))
        .group_by(DesperdicioDispatchRelease.manual_entry_id)
        .all()
    )
    return {entry_id: Decimal(str(total or 0)) for entry_id, total in rows if entry_id}


def _extrusion_bolsones_produced_by_work_order(db: Session) -> dict[int, Decimal]:
    segments = (
        db.query(ExtrusionShiftSegment)
        .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionShiftSegment.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order),
            joinedload(ExtrusionShiftSegment.extrusion_run).joinedload(ExtrusionRun.work_order),
        )
        .all()
    )
    produced: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for segment in segments:
        run = segment.extrusion_run
        if not run:
            continue
        wo = production_work_order(run)
        if not wo or wo.production_route == "sealing":
            continue
        kg = segment.bolsones_kg or Decimal("0")
        if kg <= 0:
            continue
        produced[wo.id] += kg
    return produced


def _sealing_bolsones_produced_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            SealingRun.work_order_id,
            func.coalesce(func.sum(SealingBobinaLine.production_kg), 0),
        )
        .join(SealingBobinaLine, SealingBobinaLine.sealing_run_id == SealingRun.id)
        .group_by(SealingRun.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _bolsones_dispatched_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            BolsonesDispatchShipment.work_order_id,
            func.coalesce(func.sum(BolsonesDispatchShipment.kg), 0),
        )
        .filter(BolsonesDispatchShipment.work_order_id.isnot(None))
        .group_by(BolsonesDispatchShipment.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _bolsones_released_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            BolsonesDispatchRelease.work_order_id,
            func.coalesce(func.sum(BolsonesDispatchRelease.kg), 0),
        )
        .filter(BolsonesDispatchRelease.work_order_id.isnot(None))
        .group_by(BolsonesDispatchRelease.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _desperdicio_released_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            DesperdicioDispatchRelease.work_order_id,
            func.coalesce(func.sum(DesperdicioDispatchRelease.kg), 0),
        )
        .filter(DesperdicioDispatchRelease.work_order_id.isnot(None))
        .group_by(DesperdicioDispatchRelease.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _work_order_dispatch_read(
    db: Session,
    work_order_ids: set[int],
    shipped: dict[int, Decimal],
    released: dict[int, Decimal],
) -> list[SubproductInDispatchRead]:
    if not work_order_ids:
        return []
    work_orders = (
        db.query(WorkOrder)
        .options(
            joinedload(WorkOrder.client_order).joinedload(ClientOrder.client),
            joinedload(WorkOrder.product),
        )
        .filter(WorkOrder.id.in_(work_order_ids))
        .all()
    )
    wo_map = {wo.id: wo for wo in work_orders}
    result: list[SubproductInDispatchRead] = []
    for wo_id in work_order_ids:
        wo = wo_map.get(wo_id)
        if wo and wo.production_route == "sealing":
            continue
        sent = shipped.get(wo_id, Decimal("0"))
        out = released.get(wo_id, Decimal("0"))
        in_dispatch = sent - out
        if in_dispatch <= 0:
            continue
        result.append(
            SubproductInDispatchRead(
                item_key=f"wo-{wo_id}",
                work_order_id=wo_id,
                work_order_code=wo.code if wo else None,
                client_order_code=wo.client_order.code if wo and wo.client_order else None,
                client_name=(
                    wo.client_order.client.name
                    if wo and wo.client_order and wo.client_order.client
                    else None
                ),
                measure=_bolsones_measure_for_work_order(db, wo_id, wo),
                in_dispatch_kg=str(in_dispatch),
                shipped_kg=str(sent),
                released_kg=str(out),
            )
        )
    result.sort(
        key=lambda item: (item.client_order_code or "", item.work_order_code or ""),
        reverse=True,
    )
    return result


def _manual_bolsones_pending_rows(db: Session) -> list[BolsonesPendingRead]:
    dispatched = _bolsones_dispatched_by_manual_entry(db)
    entries = db.query(BolsonesManualEntry).order_by(BolsonesManualEntry.id.desc()).all()
    result: list[BolsonesPendingRead] = []
    for entry in entries:
        sent = dispatched.get(entry.id, Decimal("0"))
        pending = (entry.kg or Decimal("0")) - sent
        if pending <= 0:
            continue
        result.append(
            BolsonesPendingRead(
                item_key=f"manual-{entry.id}",
                entry_kind="manual",
                manual_entry_id=entry.id,
                description=entry.description,
                measure=entry.measure,
                produced_kg=str(entry.kg),
                production_kg="0",
                manual_kg=str(entry.kg),
                dispatched_kg=str(sent),
                pending_kg=str(pending),
            )
        )
    return result


def _manual_bolsones_in_dispatch_read(db: Session) -> list[SubproductInDispatchRead]:
    shipped = _bolsones_dispatched_by_manual_entry(db)
    released = _bolsones_released_by_manual_entry(db)
    entry_ids = set(shipped.keys()) | set(released.keys())
    if not entry_ids:
        return []
    entries = db.query(BolsonesManualEntry).filter(BolsonesManualEntry.id.in_(entry_ids)).all()
    entry_map = {entry.id: entry for entry in entries}
    result: list[SubproductInDispatchRead] = []
    for entry_id in entry_ids:
        entry = entry_map.get(entry_id)
        sent = shipped.get(entry_id, Decimal("0"))
        out = released.get(entry_id, Decimal("0"))
        in_dispatch = sent - out
        if in_dispatch <= 0:
            continue
        result.append(
            SubproductInDispatchRead(
                item_key=f"manual-{entry_id}",
                manual_entry_id=entry_id,
                description=entry.description if entry else f"Entrada #{entry_id}",
                measure=entry.measure if entry else None,
                in_dispatch_kg=str(in_dispatch),
                shipped_kg=str(sent),
                released_kg=str(out),
            )
        )
    return result


def _manual_desperdicio_pending_rows(db: Session) -> list[DesperdicioPendingRead]:
    from modules.materials.desperdicio_stock import infer_waste_type

    dispatched = _desperdicio_dispatched_by_manual_entry(db)
    entries = db.query(DesperdicioManualEntry).order_by(DesperdicioManualEntry.id.desc()).all()
    result: list[DesperdicioPendingRead] = []
    for entry in entries:
        sent = dispatched.get(entry.id, Decimal("0"))
        pending = (entry.kg or Decimal("0")) - sent
        if pending <= 0:
            continue
        waste_type = (entry.waste_type or "").strip().lower()
        refil_kg = entry.kg if waste_type == "refil" else Decimal("0")
        transparente_kg = entry.kg if waste_type == "transparente" else Decimal("0")
        if waste_type not in ("refil", "transparente"):
            inferred = infer_waste_type(entry.description, entry.notes)
            if inferred == "refil":
                refil_kg = entry.kg or Decimal("0")
            elif inferred == "transparente":
                transparente_kg = entry.kg or Decimal("0")
            else:
                refil_kg = entry.kg or Decimal("0")
        result.append(
            DesperdicioPendingRead(
                item_key=f"manual-{entry.id}",
                entry_kind="manual",
                manual_entry_id=entry.id,
                description=entry.description,
                refil_kg=str(refil_kg),
                transparente_kg=str(transparente_kg),
                produced_kg=str(entry.kg),
                dispatched_kg=str(sent),
                pending_kg=str(pending),
            )
        )
    return result


def _manual_desperdicio_in_dispatch_read(db: Session) -> list[SubproductInDispatchRead]:
    shipped = _desperdicio_dispatched_by_manual_entry(db)
    released = _desperdicio_released_by_manual_entry(db)
    entry_ids = set(shipped.keys()) | set(released.keys())
    if not entry_ids:
        return []
    entries = db.query(DesperdicioManualEntry).filter(DesperdicioManualEntry.id.in_(entry_ids)).all()
    entry_map = {entry.id: entry for entry in entries}
    result: list[SubproductInDispatchRead] = []
    for entry_id in entry_ids:
        entry = entry_map.get(entry_id)
        sent = shipped.get(entry_id, Decimal("0"))
        out = released.get(entry_id, Decimal("0"))
        in_dispatch = sent - out
        if in_dispatch <= 0:
            continue
        result.append(
            SubproductInDispatchRead(
                item_key=f"manual-{entry_id}",
                manual_entry_id=entry_id,
                description=entry.description if entry else f"Entrada #{entry_id}",
                in_dispatch_kg=str(in_dispatch),
                shipped_kg=str(sent),
                released_kg=str(out),
            )
        )
    return result


@router.get("/dispatch/bolsones-pending", response_model=list[BolsonesPendingRead])
def bolsones_pending(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int | None = Query(default=None, ge=1),
) -> list[BolsonesPendingRead]:
    result = _bolsones_stock_by_measure(db)
    if not work_order_id:
        return result

    wo = (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.product))
        .filter(WorkOrder.id == work_order_id)
        .first()
    )
    if not wo:
        return result

    filter_measure = _normalize_measure(_bolsones_measure_for_work_order(db, work_order_id, wo))
    if not filter_measure:
        return []
    return [row for row in result if _normalize_measure(row.measure) == filter_measure]


@router.post("/dispatch/bolsones-entries", response_model=BolsonesEntryRead, status_code=201)
def create_bolsones_entry(
    payload: BolsonesEntryInput,
    db: Annotated[Session, Depends(get_db)],
) -> BolsonesEntryRead:
    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    measure = _normalize_measure(payload.measure)
    if not measure:
        raise HTTPException(status_code=422, detail="Indique la medida")

    description = (payload.description or "").strip() or f"Bolsones {measure}"

    entry = BolsonesManualEntry(
        description=description,
        measure=measure,
        kg=kg,
        notes=payload.notes,
        work_order_id=None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return BolsonesEntryRead(
        id=entry.id,
        description=entry.description,
        measure=entry.measure,
        kg=str(entry.kg),
        notes=entry.notes,
        created_at=entry.created_at,
    )


@router.post("/dispatch/bolsones-shipments", response_model=BolsonesDispatchRead, status_code=201)
def create_bolsones_shipment(
    payload: BolsonesDispatchInput,
    db: Annotated[Session, Depends(get_db)],
) -> BolsonesDispatchRead:
    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    measure = _normalize_measure(payload.measure)
    if not measure:
        raise HTTPException(status_code=422, detail="Indique la medida")

    pending = _bolsones_pending_for_measure(db, measure)
    if kg > pending:
        raise HTTPException(
            status_code=422,
            detail=f"Solo hay {pending} kg de bolsones pendientes para la medida {measure}",
        )

    shipment = BolsonesDispatchShipment(
        measure=measure,
        kg=kg,
        notes=payload.notes,
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return BolsonesDispatchRead(
        id=shipment.id,
        measure=shipment.measure,
        kg=str(shipment.kg),
        notes=shipment.notes,
        created_at=shipment.created_at,
    )


def _waste_produced_by_work_order(db: Session) -> dict[int, dict[str, Decimal]]:
    produced = _extrusion_waste_produced_by_work_order(db)
    sealing = _sealing_waste_produced_by_work_order(db)
    for wo_id, bucket in sealing.items():
        target = produced[wo_id]
        target["refil"] += bucket["refil"]
        target["transparente"] += bucket["transparente"]
        target["total"] += bucket["total"]
    return produced


def _extrusion_waste_produced_by_work_order(db: Session) -> dict[int, dict[str, Decimal]]:
    wastes = (
        db.query(ExtrusionWaste)
        .join(ExtrusionRun, ExtrusionWaste.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionWaste.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order),
            joinedload(ExtrusionWaste.extrusion_run).joinedload(ExtrusionRun.work_order),
        )
        .all()
    )
    produced: dict[int, dict[str, Decimal]] = defaultdict(
        lambda: {"refil": Decimal("0"), "transparente": Decimal("0"), "total": Decimal("0")}
    )
    for waste in wastes:
        run = waste.extrusion_run
        if not run:
            continue
        wo = production_work_order(run)
        if not wo or wo.production_route == "sealing":
            continue
        kg = waste.waste_kg or Decimal("0")
        if kg <= 0:
            continue
        bucket = produced[wo.id]
        waste_type = (waste.waste_type or "").lower()
        if waste_type == "refil":
            bucket["refil"] += kg
        elif waste_type == "transparente":
            bucket["transparente"] += kg
        bucket["total"] += kg
    return produced


def _sealing_waste_produced_by_work_order(db: Session) -> dict[int, dict[str, Decimal]]:
    produced: dict[int, dict[str, Decimal]] = defaultdict(
        lambda: {"refil": Decimal("0"), "transparente": Decimal("0"), "total": Decimal("0")}
    )
    runs = (
        db.query(SealingRun)
        .options(joinedload(SealingRun.bobina_lines))
        .all()
    )
    for run in runs:
        if not run.work_order_id:
            continue
        kg = run.waste_kg or Decimal("0")
        for line in run.bobina_lines or []:
            kg += line.waste_kg or Decimal("0")
        if kg <= 0:
            continue
        bucket = produced[run.work_order_id]
        bucket["refil"] += kg
        bucket["total"] += kg
    return produced


def _desperdicio_dispatched_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            DesperdicioDispatchShipment.work_order_id,
            func.coalesce(func.sum(DesperdicioDispatchShipment.kg), 0),
        )
        .filter(DesperdicioDispatchShipment.work_order_id.isnot(None))
        .group_by(DesperdicioDispatchShipment.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


@router.get("/dispatch/desperdicio-pending", response_model=list[DesperdicioPendingRead])
def desperdicio_pending(db: Annotated[Session, Depends(get_db)]) -> list[DesperdicioPendingRead]:
    produced = _waste_produced_by_work_order(db)
    dispatched = _desperdicio_dispatched_by_work_order(db)
    work_order_ids = set(produced.keys()) | set(dispatched.keys())

    work_orders = []
    if work_order_ids:
        work_orders = (
            db.query(WorkOrder)
            .options(joinedload(WorkOrder.client_order).joinedload(ClientOrder.client))
            .filter(WorkOrder.id.in_(work_order_ids))
            .all()
        )
    wo_map = {wo.id: wo for wo in work_orders}

    result: list[DesperdicioPendingRead] = []
    for wo_id in work_order_ids:
        wo = wo_map.get(wo_id)
        bucket = produced.get(wo_id, {"refil": Decimal("0"), "transparente": Decimal("0"), "total": Decimal("0")})
        total = bucket["total"]
        sent = dispatched.get(wo_id, Decimal("0"))
        pending = total - sent
        if pending <= 0:
            continue
        if total <= 0 and sent <= 0:
            continue
        result.append(
            DesperdicioPendingRead(
                item_key=f"wo-{wo_id}",
                entry_kind="production",
                work_order_id=wo_id,
                work_order_code=wo.code if wo else None,
                client_order_code=wo.client_order.code if wo and wo.client_order else None,
                client_name=(
                    wo.client_order.client.name
                    if wo and wo.client_order and wo.client_order.client
                    else None
                ),
                refil_kg=str(bucket["refil"]),
                transparente_kg=str(bucket["transparente"]),
                produced_kg=str(total),
                dispatched_kg=str(sent),
                pending_kg=str(pending if pending > 0 else Decimal("0")),
            )
        )

    result.extend(_manual_desperdicio_pending_rows(db))
    result.sort(
        key=lambda item: (
            item.entry_kind,
            item.client_order_code or "",
            item.work_order_code or item.description or "",
        ),
        reverse=True,
    )
    return result


@router.post("/dispatch/desperdicio-entries", response_model=DesperdicioEntryRead, status_code=201)
def create_desperdicio_entry(
    payload: DesperdicioEntryInput,
    db: Annotated[Session, Depends(get_db)],
) -> DesperdicioEntryRead:
    from modules.materials.desperdicio_stock import add_desp_stock, resolve_waste_type

    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    description = payload.description.strip()
    if not description:
        raise HTTPException(status_code=422, detail="Indique una descripción")

    try:
        waste_type = resolve_waste_type(payload.waste_type, description, payload.notes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    entry = DesperdicioManualEntry(
        description=description,
        waste_type=waste_type,
        kg=kg,
        notes=payload.notes,
        work_order_id=None,
    )
    db.add(entry)
    db.flush()
    try:
        add_desp_stock(
            db,
            waste_type,
            kg,
            movement_type="desperdicio_manual_entry",
            reference_type="desperdicio_manual_entry",
            reference_id=entry.id,
            reason=f"Entrada manual desperdicio {waste_type}",
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.commit()
    db.refresh(entry)
    return DesperdicioEntryRead(
        id=entry.id,
        description=entry.description,
        kg=str(entry.kg),
        waste_type=entry.waste_type,
        notes=entry.notes,
        created_at=entry.created_at,
    )


@router.post("/dispatch/desperdicio-shipments", response_model=DesperdicioDispatchRead, status_code=201)
def create_desperdicio_shipment(
    payload: DesperdicioDispatchInput,
    db: Annotated[Session, Depends(get_db)],
) -> DesperdicioDispatchRead:
    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    if payload.manual_entry_id:
        entry = db.get(DesperdicioManualEntry, payload.manual_entry_id)
        if not entry:
            raise HTTPException(status_code=422, detail="Entrada manual no encontrada")
        dispatched = _desperdicio_dispatched_by_manual_entry(db)
        sent = dispatched.get(entry.id, Decimal("0"))
        pending = (entry.kg or Decimal("0")) - sent
        if kg > pending:
            raise HTTPException(
                status_code=422,
                detail=f"Solo hay {pending} kg pendientes para esta entrada",
            )
        shipment = DesperdicioDispatchShipment(
            manual_entry_id=entry.id,
            kg=kg,
            notes=payload.notes,
        )
        db.add(shipment)
        db.commit()
        db.refresh(shipment)
        return DesperdicioDispatchRead(
            id=shipment.id,
            manual_entry_id=shipment.manual_entry_id,
            kg=str(shipment.kg),
            notes=shipment.notes,
            created_at=shipment.created_at,
        )

    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo no encontrado")

    produced = _waste_produced_by_work_order(db)
    dispatched = _desperdicio_dispatched_by_work_order(db)
    bucket = produced.get(wo.id, {"total": Decimal("0")})
    total = bucket["total"]
    sent = dispatched.get(wo.id, Decimal("0"))
    pending = total - sent
    if kg > pending:
        raise HTTPException(
            status_code=422,
            detail=f"Solo hay {pending} kg de desperdicio pendientes para esta orden",
        )

    shipment = DesperdicioDispatchShipment(
        work_order_id=wo.id,
        kg=kg,
        notes=payload.notes,
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return DesperdicioDispatchRead(
        id=shipment.id,
        work_order_id=shipment.work_order_id,
        kg=str(shipment.kg),
        notes=shipment.notes,
        created_at=shipment.created_at,
    )


@router.get("/dispatch/bolsones-in-dispatch", response_model=list[SubproductInDispatchRead])
def bolsones_in_dispatch(db: Annotated[Session, Depends(get_db)]) -> list[SubproductInDispatchRead]:
    shipped = _bolsones_dispatched_by_measure(db)
    released = _bolsones_released_by_measure(db)
    measures = set(shipped.keys()) | set(released.keys())
    result: list[SubproductInDispatchRead] = []
    for measure in sorted(measures):
        sent = shipped.get(measure, Decimal("0"))
        out = released.get(measure, Decimal("0"))
        in_dispatch = sent - out
        if in_dispatch <= 0:
            continue
        result.append(
            SubproductInDispatchRead(
                item_key=_measure_item_key(measure),
                measure=measure,
                in_dispatch_kg=str(in_dispatch),
                shipped_kg=str(sent),
                released_kg=str(out),
            )
        )
    result.sort(key=lambda item: item.measure or "", reverse=True)
    return result


@router.get("/dispatch/desperdicio-in-dispatch", response_model=list[SubproductInDispatchRead])
def desperdicio_in_dispatch(db: Annotated[Session, Depends(get_db)]) -> list[SubproductInDispatchRead]:
    shipped = _desperdicio_dispatched_by_work_order(db)
    released = _desperdicio_released_by_work_order(db)
    ids = set(shipped.keys()) | set(released.keys())
    result = _work_order_dispatch_read(db, ids, shipped, released)
    result.extend(_manual_desperdicio_in_dispatch_read(db))
    return result


@router.post("/dispatch/bolsones-releases", response_model=SubproductReleaseRead, status_code=201)
def create_bolsones_release(
    payload: SubproductReleaseInput,
    db: Annotated[Session, Depends(get_db)],
) -> SubproductReleaseRead:
    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    if payload.measure and payload.measure.strip():
        measure = _normalize_measure(payload.measure)
        in_dispatch = _bolsones_in_dispatch_for_measure(db, measure)
        if kg > in_dispatch:
            raise HTTPException(
                status_code=422,
                detail=f"Solo hay {in_dispatch} kg de bolsones en despacho para la medida {measure}",
            )
        release = BolsonesDispatchRelease(measure=measure, kg=kg, notes=payload.notes)
        db.add(release)
        db.commit()
        db.refresh(release)
        return SubproductReleaseRead(
            id=release.id,
            measure=release.measure,
            kg=str(release.kg),
            notes=release.notes,
            created_at=release.created_at,
        )

    if payload.manual_entry_id:
        entry = db.get(BolsonesManualEntry, payload.manual_entry_id)
        if not entry:
            raise HTTPException(status_code=422, detail="Entrada manual no encontrada")
        shipped = _bolsones_dispatched_by_manual_entry(db)
        released = _bolsones_released_by_manual_entry(db)
        in_dispatch = shipped.get(entry.id, Decimal("0")) - released.get(entry.id, Decimal("0"))
        if kg > in_dispatch:
            raise HTTPException(
                status_code=422,
                detail=f"Solo hay {in_dispatch} kg de bolsones en despacho para esta entrada",
            )
        release = BolsonesDispatchRelease(manual_entry_id=entry.id, kg=kg, notes=payload.notes)
        db.add(release)
        db.commit()
        db.refresh(release)
        return SubproductReleaseRead(
            id=release.id,
            manual_entry_id=release.manual_entry_id,
            kg=str(release.kg),
            notes=release.notes,
            created_at=release.created_at,
        )

    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo no encontrado")
    shipped = _bolsones_dispatched_by_work_order(db)
    released = _bolsones_released_by_work_order(db)
    in_dispatch = shipped.get(wo.id, Decimal("0")) - released.get(wo.id, Decimal("0"))
    if kg > in_dispatch:
        raise HTTPException(
            status_code=422,
            detail=f"Solo hay {in_dispatch} kg de bolsones en despacho para esta orden",
        )
    release = BolsonesDispatchRelease(work_order_id=wo.id, kg=kg, notes=payload.notes)
    db.add(release)
    db.commit()
    db.refresh(release)
    return SubproductReleaseRead(
        id=release.id,
        work_order_id=release.work_order_id,
        kg=str(release.kg),
        notes=release.notes,
        created_at=release.created_at,
    )


@router.post("/dispatch/desperdicio-releases", response_model=SubproductReleaseRead, status_code=201)
def create_desperdicio_release(
    payload: SubproductReleaseInput,
    db: Annotated[Session, Depends(get_db)],
) -> SubproductReleaseRead:
    from modules.materials.desperdicio_stock import (
        resolve_waste_type,
        split_waste_kg,
        subtract_desp_stock,
    )

    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    if payload.manual_entry_id:
        entry = db.get(DesperdicioManualEntry, payload.manual_entry_id)
        if not entry:
            raise HTTPException(status_code=422, detail="Entrada manual no encontrada")
        shipped = _desperdicio_dispatched_by_manual_entry(db)
        released = _desperdicio_released_by_manual_entry(db)
        in_dispatch = shipped.get(entry.id, Decimal("0")) - released.get(entry.id, Decimal("0"))
        if kg > in_dispatch:
            raise HTTPException(
                status_code=422,
                detail=f"Solo hay {in_dispatch} kg de desperdicio en despacho para esta entrada",
            )
        try:
            waste_type = resolve_waste_type(entry.waste_type, entry.description, entry.notes)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        release = DesperdicioDispatchRelease(manual_entry_id=entry.id, kg=kg, notes=payload.notes)
        db.add(release)
        db.flush()
        try:
            subtract_desp_stock(
                db,
                waste_type,
                kg,
                reference_type="desperdicio_dispatch_release",
                reference_id=release.id,
                reason=payload.notes or f"Salida desperdicio manual #{entry.id}",
                allow_negative=True,
            )
        except ValueError as exc:
            db.rollback()
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        db.commit()
        db.refresh(release)
        return SubproductReleaseRead(
            id=release.id,
            manual_entry_id=release.manual_entry_id,
            kg=str(release.kg),
            notes=release.notes,
            created_at=release.created_at,
        )

    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo no encontrado")
    shipped = _desperdicio_dispatched_by_work_order(db)
    released = _desperdicio_released_by_work_order(db)
    in_dispatch = shipped.get(wo.id, Decimal("0")) - released.get(wo.id, Decimal("0"))
    if kg > in_dispatch:
        raise HTTPException(
            status_code=422,
            detail=f"Solo hay {in_dispatch} kg de desperdicio en despacho para esta orden",
        )
    release = DesperdicioDispatchRelease(work_order_id=wo.id, kg=kg, notes=payload.notes)
    db.add(release)
    db.flush()
    bucket = _waste_produced_by_work_order(db).get(
        wo.id,
        {"refil": Decimal("0"), "transparente": Decimal("0"), "total": Decimal("0")},
    )
    try:
        for waste_type, part_kg in split_waste_kg(
            kg,
            refil_kg=bucket["refil"],
            transparente_kg=bucket["transparente"],
        ):
            subtract_desp_stock(
                db,
                waste_type,
                part_kg,
                reference_type="desperdicio_dispatch_release",
                reference_id=release.id,
                reason=payload.notes or f"Salida desperdicio OP #{wo.id}",
                allow_negative=True,
            )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.commit()
    db.refresh(release)
    return SubproductReleaseRead(
        id=release.id,
        work_order_id=release.work_order_id,
        kg=str(release.kg),
        notes=release.notes,
        created_at=release.created_at,
    )


def _resolve_coil_weights(payload: DispatchPalletCreate) -> list[tuple[int, Decimal, str | None]]:
    if payload.coils:
        return [
            (item.coil_id, Decimal(str(item.kg)), item.shift)
            for item in payload.coils
        ]
    if payload.coil_ids:
        return [(cid, Decimal("0"), None) for cid in payload.coil_ids]
    raise HTTPException(status_code=422, detail="Seleccione al menos una bobina")


@router.post("/dispatch/pallets", response_model=DispatchPalletRead, status_code=201)
def create_dispatch_pallet(
    payload: DispatchPalletCreate,
    db: Annotated[Session, Depends(get_db)],
) -> DispatchPalletRead:
    pallet = _create_dispatch_pallet(db, payload)
    db.commit()
    return _load_pallet_read(db, pallet.id)


@router.post("/dispatch/pallets/batch", response_model=list[DispatchPalletRead], status_code=201)
def create_dispatch_pallets_batch(
    payload: DispatchPalletBatchCreate,
    db: Annotated[Session, Depends(get_db)],
) -> list[DispatchPalletRead]:
    if not payload.pallets:
        raise HTTPException(status_code=422, detail="Seleccione al menos una paleta")
    batch_id = payload.dispatch_batch_id or new_dispatch_batch_id()
    client_name = payload.pallets[0].client_name
    next_num = next_pallet_number_for_client(db, client_name)
    created_ids: list[int] = []
    for index, item in enumerate(payload.pallets):
        pallet = _create_dispatch_pallet(
            db,
            item,
            pallet_number=next_num + index,
            dispatch_batch_id=batch_id,
        )
        created_ids.append(pallet.id)
    db.commit()
    return [_load_pallet_read(db, pallet_id) for pallet_id in created_ids]


def _create_dispatch_pallet(
    db: Session,
    payload: DispatchPalletCreate,
    *,
    pallet_number: int | None = None,
    dispatch_batch_id: str | None = None,
) -> DispatchPallet:
    weight_pairs = _resolve_coil_weights(payload)
    coil_ids = [pair[0] for pair in weight_pairs]
    if not coil_ids:
        raise HTTPException(status_code=422, detail="Seleccione al menos una bobina")

    coils = (
        db.query(ExtrusionCoil)
        .options(joinedload(ExtrusionCoil.extrusion_run).joinedload(ExtrusionRun.reassigned_work_order))
        .filter(ExtrusionCoil.id.in_(coil_ids))
        .all()
    )
    if len(coils) != len(coil_ids):
        raise HTTPException(status_code=422, detail="Bobina no encontrada")
    coil_map = {coil.id: coil for coil in coils}
    for coil in coils:
        if coil.pallet_id is not None:
            raise HTTPException(status_code=422, detail=f"Bobina {coil.coil_code} ya asignada")

    for coil_id, kg, _shift in weight_pairs:
        if kg <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"Ingrese el peso neto de la bobina {coil_map[coil_id].coil_code or coil_id}",
            )

    total = Decimal("0")
    ordered_coils: list[ExtrusionCoil] = []
    for coil_id, kg, shift in weight_pairs:
        coil = coil_map[coil_id]
        coil.kg = kg
        if shift:
            coil.dispatch_shift = shift.strip().lower()
        total += kg
        ordered_coils.append(coil)

    existing = [row[0] for row in db.query(DispatchPallet.code).all()]
    code = next_code("PAL-", existing)
    if pallet_number is None:
        pallet_number = next_pallet_number_for_client(db, payload.client_name)

    pallet = DispatchPallet(
        code=code,
        pallet_number=pallet_number,
        dispatch_batch_id=dispatch_batch_id,
        total_kg=total,
        client_name=payload.client_name,
        destination=payload.destination,
        product_name=payload.product_name,
        measurements=payload.measurements,
        notes=payload.notes,
    )
    db.add(pallet)
    db.flush()
    for coil in ordered_coils:
        coil.pallet_id = pallet.id
    return pallet


def _load_pallet_read(db: Session, pallet_id: int) -> DispatchPalletRead:
    pallet = (
        db.query(DispatchPallet)
        .options(
            joinedload(DispatchPallet.coils)
            .joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order)
            .joinedload(WorkOrder.client_order),
            joinedload(DispatchPallet.coils)
            .joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.work_order)
            .joinedload(WorkOrder.client_order),
        )
        .filter(DispatchPallet.id == pallet_id)
        .first()
    )
    if not pallet:
        raise HTTPException(status_code=404, detail="Paleta no encontrada")
    return _pallet_to_read(pallet)


@router.get("/dispatch/pallets", response_model=list[DispatchPalletListRead])
def list_dispatch_pallets(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int | None = Query(None, ge=1),
    from_date: date | None = Query(None),
    to_date: date | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
) -> list[DispatchPalletListRead]:
    query = (
        db.query(DispatchPallet)
        .options(
            joinedload(DispatchPallet.coils).joinedload(ExtrusionCoil.extrusion_run),
            joinedload(DispatchPallet.coils).joinedload(ExtrusionCoil.segment),
        )
        .order_by(DispatchPallet.created_at.desc())
    )
    if from_date is not None:
        query = query.filter(func.date(DispatchPallet.created_at) >= from_date)
    if to_date is not None:
        query = query.filter(func.date(DispatchPallet.created_at) <= to_date)
    pallets = query.limit(limit).all()

    if work_order_id:
        filtered = []
        for pallet in pallets:
            for coil in pallet.coils or []:
                if coil.extrusion_run and production_work_order_id(coil.extrusion_run) == work_order_id:
                    filtered.append(pallet)
                    break
        pallets = filtered

    return [
        DispatchPalletListRead(
            id=pallet.id,
            code=pallet.code,
            pallet_number=pallet.pallet_number,
            display_label=pallet_display_label(pallet),
            dispatch_batch_id=pallet.dispatch_batch_id,
            total_kg=str(pallet.total_kg),
            client_name=pallet.client_name,
            destination=pallet.destination,
            product_name=pallet.product_name,
            measurements=pallet.measurements,
            coil_count=len(pallet.coils or []),
            coils=[
                {
                    "coil_code": coil.coil_code or str(coil.id),
                    "kg": str(coil.kg or 0),
                    "shift": _coil_shift(coil),
                }
                for coil in sorted(pallet.coils or [], key=lambda c: c.id)
            ],
            created_at=pallet.created_at,
        )
        for pallet in pallets
    ]


@router.get("/dispatch/pallets/{pallet_id}", response_model=DispatchPalletRead)
def get_dispatch_pallet(pallet_id: int, db: Annotated[Session, Depends(get_db)]) -> DispatchPalletRead:
    pallet = (
        db.query(DispatchPallet)
        .options(
            joinedload(DispatchPallet.coils)
            .joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order)
            .joinedload(WorkOrder.client_order),
            joinedload(DispatchPallet.coils)
            .joinedload(ExtrusionCoil.extrusion_run)
            .joinedload(ExtrusionRun.work_order)
            .joinedload(WorkOrder.client_order),
        )
        .filter(DispatchPallet.id == pallet_id)
        .first()
    )
    if not pallet:
        raise HTTPException(status_code=404, detail="Paleta no encontrada")
    return _pallet_to_read(pallet)


def _fallas_produced_by_work_order(db: Session) -> dict[int, Decimal]:
    segments = (
        db.query(ExtrusionShiftSegment)
        .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionShiftSegment.extrusion_run)
            .joinedload(ExtrusionRun.reassigned_work_order),
            joinedload(ExtrusionShiftSegment.extrusion_run).joinedload(ExtrusionRun.work_order),
        )
        .all()
    )
    produced: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for segment in segments:
        run = segment.extrusion_run
        if not run:
            continue
        wo = production_work_order(run)
        if not wo or wo.production_route == "sealing":
            continue
        kg = segment.fallas_kg or Decimal("0")
        if kg <= 0:
            continue
        produced[wo.id] += kg
    return produced


def _fallas_returns_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            InventoryReturn.work_order_id,
            func.coalesce(func.sum(InventoryReturn.quantity), 0),
        )
        .filter(
            InventoryReturn.destination_area == "fallas",
            InventoryReturn.status == "accepted",
            InventoryReturn.work_order_id.isnot(None),
        )
        .group_by(InventoryReturn.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _fallas_sent_to_materials_by_work_order(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            FallasMaterialsShipment.work_order_id,
            func.coalesce(func.sum(FallasMaterialsShipment.kg), 0),
        )
        .filter(FallasMaterialsShipment.work_order_id.isnot(None))
        .group_by(FallasMaterialsShipment.work_order_id)
        .all()
    )
    return {wo_id: Decimal(str(total or 0)) for wo_id, total in rows if wo_id}


def _fallas_sent_to_materials_by_manual_entry(db: Session) -> dict[int, Decimal]:
    rows = (
        db.query(
            FallasMaterialsShipment.manual_entry_id,
            func.coalesce(func.sum(FallasMaterialsShipment.kg), 0),
        )
        .filter(FallasMaterialsShipment.manual_entry_id.isnot(None))
        .group_by(FallasMaterialsShipment.manual_entry_id)
        .all()
    )
    return {entry_id: Decimal(str(total or 0)) for entry_id, total in rows if entry_id}


@router.get("/dispatch/fallas-pending", response_model=list[FallasPendingRead])
def fallas_pending(db: Annotated[Session, Depends(get_db)]) -> list[FallasPendingRead]:
    extrusion = _fallas_produced_by_work_order(db)
    returns = _fallas_returns_by_work_order(db)
    sent = _fallas_sent_to_materials_by_work_order(db)
    work_order_ids = set(extrusion.keys()) | set(returns.keys()) | set(sent.keys())

    work_orders = []
    if work_order_ids:
        work_orders = (
            db.query(WorkOrder)
            .options(joinedload(WorkOrder.client_order).joinedload(ClientOrder.client))
            .filter(WorkOrder.id.in_(work_order_ids))
            .all()
        )
    wo_map = {wo.id: wo for wo in work_orders}

    result: list[FallasPendingRead] = []
    for wo_id in work_order_ids:
        wo = wo_map.get(wo_id)
        ext_kg = extrusion.get(wo_id, Decimal("0"))
        ret_kg = returns.get(wo_id, Decimal("0"))
        total = ext_kg + ret_kg
        shipped = sent.get(wo_id, Decimal("0"))
        pending = total - shipped
        if pending <= 0 and total <= 0:
            continue
        result.append(
            FallasPendingRead(
                item_key=f"wo-{wo_id}",
                entry_kind="production",
                work_order_id=wo_id,
                work_order_code=wo.code if wo else None,
                client_order_code=wo.client_order.code if wo and wo.client_order else None,
                client_name=(
                    wo.client_order.client.name
                    if wo and wo.client_order and wo.client_order.client
                    else None
                ),
                extrusion_kg=str(ext_kg),
                returns_kg=str(ret_kg),
                produced_kg=str(total),
                sent_to_materials_kg=str(shipped),
                pending_kg=str(pending if pending > 0 else Decimal("0")),
            )
        )
    result.sort(key=lambda item: item.client_order_code or "", reverse=True)
    return result


@router.post("/dispatch/fallas-materials-shipments", response_model=FallasMaterialsRead, status_code=201)
def create_fallas_materials_shipment(
    payload: FallasMaterialsInput,
    db: Annotated[Session, Depends(get_db)],
) -> FallasMaterialsRead:
    kg = Decimal(str(payload.kg))
    if kg <= 0:
        raise HTTPException(status_code=422, detail="Ingrese un peso mayor a cero")

    if payload.manual_entry_id:
        entry = db.get(FallasManualEntry, payload.manual_entry_id)
        if not entry:
            raise HTTPException(status_code=422, detail="Entrada manual no encontrada")
        sent = _fallas_sent_to_materials_by_manual_entry(db).get(entry.id, Decimal("0"))
        pending = (entry.kg or Decimal("0")) - sent
        if kg > pending:
            raise HTTPException(status_code=422, detail=f"Solo hay {pending} kg pendientes para esta entrada")
        shipment = FallasMaterialsShipment(
            manual_entry_id=entry.id,
            kg=kg,
            notes=payload.notes,
            status="pending",
        )
        db.add(shipment)
        db.commit()
        db.refresh(shipment)
        return FallasMaterialsRead(
            id=shipment.id,
            manual_entry_id=shipment.manual_entry_id,
            kg=str(shipment.kg),
            status=shipment.status,
            notes=shipment.notes,
            created_at=shipment.created_at,
        )

    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo no encontrado")

    ext_kg = _fallas_produced_by_work_order(db).get(wo.id, Decimal("0"))
    ret_kg = _fallas_returns_by_work_order(db).get(wo.id, Decimal("0"))
    total = ext_kg + ret_kg
    sent = _fallas_sent_to_materials_by_work_order(db).get(wo.id, Decimal("0"))
    pending = total - sent
    if kg > pending:
        raise HTTPException(status_code=422, detail=f"Solo hay {pending} kg de fallas pendientes para esta orden")

    shipment = FallasMaterialsShipment(
        work_order_id=wo.id,
        kg=kg,
        notes=payload.notes,
        status="pending",
    )
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return FallasMaterialsRead(
        id=shipment.id,
        work_order_id=shipment.work_order_id,
        kg=str(shipment.kg),
        status=shipment.status,
        notes=shipment.notes,
        created_at=shipment.created_at,
    )


@router.post("/dispatch/fallas-materials-shipments/{shipment_id}/accept", response_model=FallasMaterialsRead)
def accept_fallas_materials_shipment(
    shipment_id: int,
    payload: FallasMaterialsAcceptInput,
    db: Annotated[Session, Depends(get_db)],
) -> FallasMaterialsRead:
    from datetime import datetime

    from modules.materials.models import InventoryMovement, Material

    shipment = db.get(FallasMaterialsShipment, shipment_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Envío de fallas no encontrado")
    if shipment.status != "pending":
        raise HTTPException(status_code=422, detail="El envío ya fue procesado")

    sku = "FALLAS-RECICLADO"
    material = db.query(Material).filter(Material.sku == sku).first()
    if not material:
        material = Material(
            sku=sku,
            name="Fallas recicladas (sustrato)",
            inventory_area="material",
            unit="kg",
            quantity_on_hand=Decimal("0"),
        )
        db.add(material)
        db.flush()

    material.quantity_on_hand += shipment.kg
    db.add(
        InventoryMovement(
            material_id=material.id,
            movement_type="inventory_return",
            quantity=shipment.kg,
            reference_type="fallas_materials_shipment",
            reference_id=shipment.id,
            occurred_at=datetime.now(),
            reason=payload.reason or shipment.notes or f"Fallas a materiales #{shipment.id}",
        )
    )
    shipment.status = "accepted"
    db.commit()
    db.refresh(shipment)
    return FallasMaterialsRead(
        id=shipment.id,
        work_order_id=shipment.work_order_id,
        manual_entry_id=shipment.manual_entry_id,
        inventory_return_id=shipment.inventory_return_id,
        kg=str(shipment.kg),
        status=shipment.status,
        notes=shipment.notes,
        created_at=shipment.created_at,
    )


@router.get("/dispatch/fallas-materials-shipments/pending", response_model=list[FallasMaterialsRead])
def list_pending_fallas_materials_shipments(
    db: Annotated[Session, Depends(get_db)],
) -> list[FallasMaterialsRead]:
    rows = (
        db.query(FallasMaterialsShipment)
        .filter(FallasMaterialsShipment.status == "pending")
        .order_by(FallasMaterialsShipment.id.desc())
        .all()
    )
    return [
        FallasMaterialsRead(
            id=row.id,
            work_order_id=row.work_order_id,
            manual_entry_id=row.manual_entry_id,
            inventory_return_id=row.inventory_return_id,
            kg=str(row.kg),
            status=row.status,
            notes=row.notes,
            created_at=row.created_at,
        )
        for row in rows
    ]
