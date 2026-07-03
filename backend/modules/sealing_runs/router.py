from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.extrusion_runs.service import extrusion_production_filter
from modules.production.helpers import parse_datetime
from modules.production.models import ExtrusionCoil, ExtrusionRun, ExtrusionShiftSegment, SealingBobinaLine, SealingRun, WorkOrder
from modules.sealing_runs.schemas import (
    PaginatedSealingRuns,
    SealingBobinaLineRead,
    SealingExtrusionCoilRead,
    SealingRunInput,
    SealingRunRead,
)

router = APIRouter(tags=["sealing-runs"])


def _work_order_measure(wo: WorkOrder | None) -> str | None:
    if not wo or not wo.product:
        return None
    structure = (wo.product.structure or "").strip()
    if structure:
        return structure
    name = (wo.product.name or "").strip()
    return name or None


def _sealed_extrusion_coil_ids(db: Session, work_order_id: int) -> set[int]:
    rows = (
        db.query(SealingBobinaLine.extrusion_coil_id)
        .join(SealingRun, SealingBobinaLine.sealing_run_id == SealingRun.id)
        .filter(
            SealingRun.work_order_id == work_order_id,
            SealingBobinaLine.extrusion_coil_id.isnot(None),
        )
        .all()
    )
    return {coil_id for (coil_id,) in rows if coil_id}


def _latest_extrusion_coils_for_sealing(db: Session, work_order_id: int) -> list[ExtrusionCoil]:
    latest_run = (
        db.query(ExtrusionRun)
        .filter(extrusion_production_filter(work_order_id), ExtrusionRun.status == "completed")
        .order_by(ExtrusionRun.id.desc())
        .first()
    )
    if not latest_run:
        return []

    segments = (
        db.query(ExtrusionShiftSegment)
        .options(joinedload(ExtrusionShiftSegment.coils))
        .filter(ExtrusionShiftSegment.extrusion_run_id == latest_run.id)
        .order_by(ExtrusionShiftSegment.id.desc())
        .all()
    )
    target_segment = next((segment for segment in segments if segment.coils), None)
    if not target_segment:
        return []

    sealed_ids = _sealed_extrusion_coil_ids(db, work_order_id)
    return [
        coil
        for coil in sorted(target_segment.coils, key=lambda item: item.id)
        if coil.id not in sealed_ids
    ]


def _to_read(run: SealingRun) -> SealingRunRead:
    return SealingRunRead(
        id=run.id,
        work_order_id=run.work_order_id,
        work_order_code=run.work_order.code if run.work_order else None,
        shift=run.shift,
        recorded_at=run.recorded_at,
        recorded_date=run.recorded_date,
        started_at=run.started_at,
        ended_at=run.ended_at,
        effective_minutes=str(run.effective_minutes) if run.effective_minutes is not None else None,
        total_units=str(run.total_units),
        waste_kg=str(run.waste_kg),
        notes=run.notes,
        status=run.status,
        bobina_lines=[
            SealingBobinaLineRead(
                id=line.id,
                extrusion_coil_id=line.extrusion_coil_id,
                coil_code=line.coil_code,
                measure=line.measure,
                units=str(line.units),
                production_kg=str(line.production_kg) if line.production_kg is not None else None,
                waste_kg=str(line.waste_kg) if line.waste_kg is not None else None,
            )
            for line in run.bobina_lines
        ],
        created_at=run.created_at,
    )


@router.get("/sealing-runs/extrusion-coils", response_model=list[SealingExtrusionCoilRead])
def list_extrusion_coils_for_sealing(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int = Query(..., ge=1),
) -> list[SealingExtrusionCoilRead]:
    wo = (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.product))
        .filter(WorkOrder.id == work_order_id)
        .first()
    )
    if not wo:
        raise HTTPException(status_code=404, detail="Trabajo en planta no encontrado")

    measure = _work_order_measure(wo)
    coils = _latest_extrusion_coils_for_sealing(db, work_order_id)
    return [
        SealingExtrusionCoilRead(
            id=coil.id,
            coil_code=coil.coil_code or f"BOB-{coil.id}",
            production_kg=str(coil.kg or 0),
            measure=measure,
        )
        for coil in coils
    ]


@router.post("/sealing-runs", response_model=SealingRunRead, status_code=201)
def create_sealing_run(
    payload: SealingRunInput,
    db: Annotated[Session, Depends(get_db)],
) -> SealingRunRead:
    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo en planta no válido")

    lines = [ln for ln in payload.bobina_lines if Decimal(str(ln.units)) > 0]
    if not lines:
        raise HTTPException(status_code=422, detail="Registre al menos una bobina con unidades")

    now = datetime.now()
    recorded_at = parse_datetime(payload.recorded_at) if payload.recorded_at else now
    started_at = parse_datetime(payload.started_at) if payload.started_at else None
    ended_at = parse_datetime(payload.ended_at) if payload.ended_at else None
    effective = (
        Decimal(str(payload.effective_minutes))
        if payload.effective_minutes is not None
        else None
    )
    if effective is None and started_at and ended_at:
        effective = Decimal(str(round((ended_at - started_at).total_seconds() / 60, 2)))

    total_units = sum((Decimal(str(ln.units)) for ln in lines), Decimal("0"))
    line_waste = sum(
        (Decimal(str(ln.waste_kg or 0)) for ln in lines),
        Decimal("0"),
    )
    global_waste = Decimal(str(payload.waste_kg or 0))
    waste_kg = line_waste if line_waste > 0 else global_waste

    run = SealingRun(
        work_order_id=payload.work_order_id,
        shift=payload.shift,
        recorded_at=recorded_at,
        recorded_date=recorded_at.date(),
        started_at=started_at,
        ended_at=ended_at,
        effective_minutes=effective,
        total_units=total_units,
        waste_kg=waste_kg,
        notes=payload.notes.strip() if payload.notes else None,
        status="completed",
    )
    db.add(run)
    db.flush()

    for line in lines:
        production_kg = (
            Decimal(str(line.production_kg))
            if line.production_kg is not None and str(line.production_kg).strip()
            else None
        )
        line_waste_kg = Decimal(str(line.waste_kg or 0))
        db.add(
            SealingBobinaLine(
                sealing_run_id=run.id,
                extrusion_coil_id=line.extrusion_coil_id,
                coil_code=line.coil_code.strip() if line.coil_code else None,
                measure=line.measure.strip() if line.measure else None,
                units=Decimal(str(line.units)),
                production_kg=production_kg,
                waste_kg=line_waste_kg,
            )
        )

    db.commit()
    run = (
        db.query(SealingRun)
        .options(joinedload(SealingRun.work_order), joinedload(SealingRun.bobina_lines))
        .filter(SealingRun.id == run.id)
        .first()
    )
    return _to_read(run)


@router.get("/sealing-runs/{run_id}", response_model=SealingRunRead)
def get_sealing_run(run_id: int, db: Annotated[Session, Depends(get_db)]) -> SealingRunRead:
    run = (
        db.query(SealingRun)
        .options(joinedload(SealingRun.work_order), joinedload(SealingRun.bobina_lines))
        .filter(SealingRun.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Registro de sellado no encontrado")
    return _to_read(run)


@router.get("/sealing-runs", response_model=PaginatedSealingRuns)
def list_sealing_runs(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    work_order_id: int | None = None,
    on_date: date | None = None,
) -> PaginatedSealingRuns:
    query = (
        db.query(SealingRun)
        .options(joinedload(SealingRun.work_order), joinedload(SealingRun.bobina_lines))
        .order_by(SealingRun.recorded_at.desc())
    )
    if work_order_id:
        query = query.filter(SealingRun.work_order_id == work_order_id)
    if on_date:
        query = query.filter(SealingRun.recorded_date == on_date)
    return PaginatedSealingRuns(**paginate(query, page, per_page, _to_read))
