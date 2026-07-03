from collections import defaultdict
from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.extrusion_runs.schemas import (
    ExtrusionActiveSessionRead,
    ExtrusionCloseInput,
    ExtrusionCompleteInput,
    ExtrusionDailySummary,
    ExtrusionCoilRead,
    ExtrusionRegisterInput,
    ExtrusionReassignInput,
    ExtrusionRunDetailRead,
    ExtrusionRunRead,
    ExtrusionRunResponse,
    ExtrusionSegmentInput,
    ExtrusionSegmentRead,
    ExtrusionSessionCreateInput,
    ExtrusionStartInput,
    ExtrusionWasteRead,
    PaginatedExtrusionRuns,
)
from modules.extrusion_runs.service import (
    _apply_coils,
    _apply_waste,
    add_segment,
    close_session,
    get_active_session,
    get_or_create_session,
    extrusion_production_filter,
    normalize_machine,
    production_work_order,
    production_work_order_id,
    validate_work_orders,
)
from modules.production.helpers import parse_datetime
from modules.production.models import ExtrusionRun, ExtrusionShiftSegment, WorkOrder

router = APIRouter(tags=["extrusion-runs"])


def _segment_read(segment) -> ExtrusionSegmentRead:
    return ExtrusionSegmentRead(
        id=segment.id,
        shift=segment.shift,
        operator_name=segment.operator_name,
        started_at=segment.started_at,
        ended_at=segment.ended_at,
        effective_minutes=str(segment.effective_minutes),
        production_format=segment.production_format,
        machine=segment.machine,
        total_kg=str(segment.total_kg),
        core_kg=str(segment.core_kg),
        recorded_at=segment.recorded_at,
        coils=[
            ExtrusionCoilRead(
                id=c.id,
                microns=[float(m) for m in c.microns],
                kg=str(c.kg),
                coil_code=c.coil_code,
            )
            for c in segment.coils
        ],
        waste_lines=[
            ExtrusionWasteRead(id=w.id, waste_type=w.waste_type, waste_kg=str(w.waste_kg))
            for w in segment.waste_lines
        ],
    )


def _to_read(run: ExtrusionRun) -> ExtrusionRunRead:
    prod_wo = production_work_order(run)
    return ExtrusionRunRead(
        id=run.id,
        work_order_id=run.work_order_id,
        reassigned_work_order_id=run.reassigned_work_order_id,
        shift=run.shift,
        recorded_at=run.recorded_at,
        recorded_date=run.recorded_date,
        started_at=run.started_at,
        ended_at=run.ended_at,
        effective_minutes=str(run.effective_minutes) if run.effective_minutes is not None else None,
        total_effective_minutes=str(run.total_effective_minutes)
        if run.total_effective_minutes is not None
        else None,
        machine=run.machine,
        production_format=run.production_format,
        target_kg=str(run.target_kg) if run.target_kg is not None else None,
        total_kg=str(run.total_kg),
        core_kg=str(run.core_kg),
        status=run.status,
        work_order_code=run.work_order.code if run.work_order else None,
        reassigned_work_order_code=run.reassigned_work_order.code if run.reassigned_work_order else None,
        production_work_order_id=production_work_order_id(run),
        production_work_order_code=prod_wo.code if prod_wo else None,
        created_at=run.created_at,
    )


def _to_detail(run: ExtrusionRun) -> ExtrusionRunDetailRead:
    base = _to_read(run)
    legacy_coils = [c for c in run.coils if c.segment_id is None]
    legacy_waste = [w for w in run.waste_lines if w.segment_id is None]
    return ExtrusionRunDetailRead(
        **base.model_dump(),
        coils=[
            ExtrusionCoilRead(
                id=c.id,
                microns=[float(m) for m in c.microns],
                kg=str(c.kg),
                coil_code=c.coil_code,
            )
            for c in legacy_coils
        ],
        waste_lines=[
            ExtrusionWasteRead(id=w.id, waste_type=w.waste_type, waste_kg=str(w.waste_kg))
            for w in legacy_waste
        ],
        segments=[_segment_read(s) for s in run.segments],
    )


def _load_run_simple(db: Session, run_id: int) -> ExtrusionRun:
    run = (
        db.query(ExtrusionRun)
        .options(
            joinedload(ExtrusionRun.work_order),
            joinedload(ExtrusionRun.reassigned_work_order),
            joinedload(ExtrusionRun.coils),
            joinedload(ExtrusionRun.waste_lines),
            joinedload(ExtrusionRun.segments)
            .joinedload(ExtrusionShiftSegment.coils),
            joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
        )
        .filter(ExtrusionRun.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Registro de extrusión no encontrado")
    return run


def _set_timer_fields(
    run: ExtrusionRun,
    *,
    started_at,
    ended_at,
    effective_minutes,
    recorded_at,
) -> None:
    if started_at is not None:
        run.started_at = parse_datetime(started_at)
    if ended_at is not None:
        run.ended_at = parse_datetime(ended_at)
    if effective_minutes is not None:
        run.effective_minutes = Decimal(str(effective_minutes))
    elif run.started_at and run.ended_at:
        delta = run.ended_at - run.started_at
        run.effective_minutes = Decimal(str(round(delta.total_seconds() / 60, 2)))
    if recorded_at is not None:
        run.recorded_at = parse_datetime(recorded_at)


def _segment_kwargs(payload: ExtrusionSegmentInput) -> dict:
    started = parse_datetime(payload.started_at) if payload.started_at else None
    ended = parse_datetime(payload.ended_at) if payload.ended_at else None
    core = Decimal(str(payload.core_kg)) if payload.core_kg is not None else Decimal("0")
    if core < 0:
        raise ValueError("El peso del core no puede ser negativo")
    produced = (
        Decimal(str(payload.produced_kg)) if payload.produced_kg is not None else None
    )
    kwargs: dict = {
        "shift": payload.shift,
        "operator_name": payload.operator_name,
        "started_at": started,
        "ended_at": ended,
        "effective_minutes": Decimal(str(payload.effective_minutes)),
        "production_format": payload.production_format,
        "machine": normalize_machine(payload.machine) if payload.machine else None,
        "coils_data": payload.coils,
        "waste_data": payload.waste_lines,
        "bolsones_kg": Decimal(str(payload.bolsones_kg))
        if payload.bolsones_kg is not None
        else Decimal("0"),
        "fallas_kg": Decimal(str(payload.fallas_kg)) if payload.fallas_kg is not None else Decimal("0"),
        "core_kg": core,
        "require_kg": False,
    }
    if produced is not None and payload.coils_count is not None:
        kwargs["produced_kg"] = produced
        kwargs["coils_count"] = payload.coils_count
        kwargs["require_kg"] = True
    elif payload.coils_count is not None and not payload.coils:
        kwargs["coils_count"] = payload.coils_count
        kwargs["require_kg"] = False
    return kwargs


@router.get("/extrusion-runs/active", response_model=ExtrusionActiveSessionRead | None)
def get_active_extrusion_session(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int = Query(..., ge=1),
    on_date: date | None = None,
) -> ExtrusionActiveSessionRead | None:
    from modules.production.models import ExtrusionShiftSegment

    run = get_active_session(db, work_order_id, on_date)
    if not run:
        return None
    run = (
        db.query(ExtrusionRun)
        .options(
            joinedload(ExtrusionRun.work_order),
            joinedload(ExtrusionRun.segments)
            .joinedload(ExtrusionShiftSegment.coils),
            joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
        )
        .filter(ExtrusionRun.id == run.id)
        .first()
    )
    if not run:
        return None
    return ExtrusionActiveSessionRead(
        session=_to_read(run),
        segments=[_segment_read(s) for s in run.segments],
    )


@router.post("/extrusion-runs/sessions", response_model=ExtrusionActiveSessionRead, status_code=201)
def create_extrusion_session(
    payload: ExtrusionSessionCreateInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionActiveSessionRead:
    try:
        target_date = payload.recorded_date
        if isinstance(target_date, str):
            target_date = date.fromisoformat(target_date)
        machine = normalize_machine(payload.machine) if payload.machine else None
        run = get_or_create_session(
            db,
            payload.work_order_id,
            machine=machine,
            target_kg=Decimal(str(payload.target_kg)) if payload.target_kg is not None else None,
            on_date=target_date,
            mixture_production_run_id=payload.mixture_production_run_id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    run = _load_run_simple(db, run.id)
    return ExtrusionActiveSessionRead(session=_to_read(run), segments=[_segment_read(s) for s in run.segments])


@router.post("/extrusion-runs/{run_id}/segments", response_model=ExtrusionSegmentRead, status_code=201)
def add_extrusion_segment(
    run_id: int,
    payload: ExtrusionSegmentInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionSegmentRead:
    run = _load_run_simple(db, run_id)
    try:
        segment = add_segment(db, run, **_segment_kwargs(payload))
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    run = _load_run_simple(db, run_id)
    segment = next(s for s in run.segments if s.id == segment.id)
    return _segment_read(segment)


@router.post("/extrusion-runs/{run_id}/close", response_model=ExtrusionRunResponse)
def close_extrusion_session(
    run_id: int,
    payload: ExtrusionCloseInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionRunResponse:
    run = _load_run_simple(db, run_id)
    try:
        if payload.reassigned_work_order_id:
            validate_work_orders(db, run.work_order_id, payload.reassigned_work_order_id)
            run.reassigned_work_order_id = payload.reassigned_work_order_id
        last_kwargs = _segment_kwargs(payload.last_segment) if payload.last_segment else None
        run, mixture_remaining = close_session(
            db,
            run,
            last_segment_kwargs=last_kwargs,
            complete_mixture=payload.complete_mixture,
            mark_work_completed=payload.mark_work_completed,
            production_route=payload.production_route,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    run = _load_run_simple(db, run_id)
    return ExtrusionRunResponse(
        id=run.id,
        total_kg=str(run.total_kg),
        total_effective_minutes=str(run.total_effective_minutes),
        mixture_remaining_kg=str(mixture_remaining) if mixture_remaining is not None else None,
        mixture_run_id=run.mixture_production_run_id,
    )


@router.post("/extrusion-runs/start", response_model=ExtrusionRunRead, status_code=201)
def start_extrusion_run(
    payload: ExtrusionStartInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionRunRead:
    try:
        run = get_or_create_session(
            db,
            payload.work_order_id,
            machine=normalize_machine(payload.machine) if payload.machine else None,
            target_kg=Decimal(str(payload.target_kg)) if payload.target_kg is not None else None,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _to_read(_load_run_simple(db, run.id))


@router.post("/extrusion-runs/{run_id}/complete", response_model=ExtrusionRunResponse)
def complete_extrusion_run(
    run_id: int,
    payload: ExtrusionCompleteInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionRunResponse:
    run = _load_run_simple(db, run_id)
    if run.status == "completed":
        raise HTTPException(status_code=422, detail="El registro ya está culminado")
    try:
        validate_work_orders(db, run.work_order_id, payload.reassigned_work_order_id)
        _set_timer_fields(
            run,
            started_at=payload.started_at or run.started_at,
            ended_at=payload.ended_at or datetime.now(),
            effective_minutes=payload.effective_minutes,
            recorded_at=payload.recorded_at,
        )
        if payload.reassigned_work_order_id:
            run.reassigned_work_order_id = payload.reassigned_work_order_id
        total = _apply_coils(run, payload.coils, db)
        _apply_waste(run, payload.waste_lines, db)
        run.status = "completed"
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return ExtrusionRunResponse(id=run.id, total_kg=str(total))


@router.post("/extrusion-runs", response_model=ExtrusionRunResponse, status_code=201)
def create_extrusion_run(
    payload: ExtrusionRegisterInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionRunResponse:
    try:
        validate_work_orders(db, payload.work_order_id, payload.reassigned_work_order_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    now = datetime.now()
    run = ExtrusionRun(
        work_order_id=payload.work_order_id,
        reassigned_work_order_id=payload.reassigned_work_order_id,
        shift=payload.shift,
        recorded_at=parse_datetime(payload.recorded_at) if payload.recorded_at else now,
        recorded_date=date.today(),
        machine=normalize_machine(payload.machine) if payload.machine else None,
        production_format=payload.production_format,
        target_kg=Decimal(str(payload.target_kg)) if payload.target_kg is not None else None,
        total_kg=Decimal("0"),
        status="completed",
    )
    db.add(run)
    db.flush()
    try:
        _set_timer_fields(
            run,
            started_at=payload.started_at,
            ended_at=payload.ended_at,
            effective_minutes=payload.effective_minutes,
            recorded_at=None,
        )
        if payload.effective_minutes:
            run.total_effective_minutes = Decimal(str(payload.effective_minutes))
        total = _apply_coils(run, payload.coils, db)
        _apply_waste(run, payload.waste_lines, db)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return ExtrusionRunResponse(
        id=run.id,
        total_kg=str(total),
        total_effective_minutes=str(run.total_effective_minutes or run.effective_minutes or 0),
    )


@router.patch("/extrusion-runs/{run_id}/reassign", response_model=ExtrusionRunRead)
def reassign_extrusion_run(
    run_id: int,
    payload: ExtrusionReassignInput,
    db: Annotated[Session, Depends(get_db)],
) -> ExtrusionRunRead:
    run = _load_run_simple(db, run_id)
    if payload.reassigned_work_order_id is not None:
        try:
            validate_work_orders(db, run.work_order_id, payload.reassigned_work_order_id)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        run.reassigned_work_order_id = payload.reassigned_work_order_id
    if payload.mixture_source_work_order_id is not None:
        source = db.get(WorkOrder, payload.mixture_source_work_order_id)
        if not source:
            raise HTTPException(status_code=422, detail="Trabajo origen de mezcla no valido")
        run.mixture_source_work_order_id = payload.mixture_source_work_order_id
    db.commit()
    return _to_read(_load_run_simple(db, run_id))


@router.get("/extrusion-runs/daily-summary", response_model=list[ExtrusionDailySummary])
def extrusion_daily_summary(
    db: Annotated[Session, Depends(get_db)],
    on_date: date | None = None,
) -> list[ExtrusionDailySummary]:
    target = on_date or date.today()
    date_filter = or_(
        ExtrusionRun.recorded_date == target,
        func.date(ExtrusionRun.recorded_at) == target,
    )

    segments = (
        db.query(ExtrusionShiftSegment)
        .join(ExtrusionRun, ExtrusionShiftSegment.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionShiftSegment.waste_lines),
            joinedload(ExtrusionShiftSegment.coils),
        )
        .filter(date_filter)
        .all()
    )

    if segments:
        groups: dict[tuple[str | None, str | None], dict] = defaultdict(
            lambda: {
                "total_kg": Decimal("0"),
                "bolsones_kg": Decimal("0"),
                "core_kg": Decimal("0"),
                "waste_kg": Decimal("0"),
                "coils_count": 0,
                "runs_count": 0,
            }
        )
        for segment in segments:
            key = (segment.shift, segment.machine)
            bucket = groups[key]
            bucket["total_kg"] += segment.total_kg or Decimal("0")
            bucket["bolsones_kg"] += segment.bolsones_kg or Decimal("0")
            bucket["core_kg"] += segment.core_kg or Decimal("0")
            bucket["waste_kg"] += sum(
                (line.waste_kg for line in segment.waste_lines),
                Decimal("0"),
            )
            bucket["coils_count"] += sum(
                1 for coil in segment.coils if (coil.kg or Decimal("0")) > 0
            )
            bucket["runs_count"] += 1

        return [
            ExtrusionDailySummary(
                date=target,
                shift=shift,
                machine=machine,
                total_kg=str(values["total_kg"]),
                total_bolsones_kg=str(values["bolsones_kg"]),
                total_core_kg=str(values["core_kg"]),
                total_waste_kg=str(values["waste_kg"]),
                coils_count=values["coils_count"],
                runs_count=values["runs_count"],
            )
            for (shift, machine), values in sorted(
                groups.items(),
                key=lambda item: (item[0][1] or "", item[0][0] or ""),
            )
        ]

    rows = (
        db.query(
            ExtrusionRun.shift,
            ExtrusionRun.machine,
            func.sum(ExtrusionRun.total_kg),
            func.sum(ExtrusionRun.bolsones_kg),
            func.sum(ExtrusionRun.core_kg),
            func.count(ExtrusionRun.id),
        )
        .filter(date_filter)
        .group_by(ExtrusionRun.shift, ExtrusionRun.machine)
        .all()
    )
    return [
        ExtrusionDailySummary(
            date=target,
            shift=shift,
            machine=machine,
            total_kg=str(total or 0),
            total_bolsones_kg=str(bolsones or 0),
            total_core_kg=str(core or 0),
            total_waste_kg="0",
            coils_count=0,
            runs_count=count,
        )
        for shift, machine, total, bolsones, core, count in rows
    ]


@router.get("/extrusion-runs/{run_id}", response_model=ExtrusionRunDetailRead)
def get_extrusion_run(run_id: int, db: Annotated[Session, Depends(get_db)]) -> ExtrusionRunDetailRead:
    return _to_detail(_load_run_simple(db, run_id))


@router.get("/extrusion-runs", response_model=PaginatedExtrusionRuns)
def list_extrusion_runs(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    work_order_id: int | None = None,
    include_reassigned: bool = False,
    on_date: date | None = None,
    shift: str | None = None,
    machine: str | None = None,
) -> PaginatedExtrusionRuns:
    query = db.query(ExtrusionRun).options(
        joinedload(ExtrusionRun.work_order),
        joinedload(ExtrusionRun.reassigned_work_order),
    )
    if work_order_id:
        query = query.filter(extrusion_production_filter(work_order_id))
    if on_date:
        query = query.filter(
            or_(
                ExtrusionRun.recorded_date == on_date,
                func.date(ExtrusionRun.recorded_at) == on_date,
            )
        )
    if shift:
        query = query.filter(ExtrusionRun.shift == shift)
    if machine:
        query = query.filter(ExtrusionRun.machine == normalize_machine(machine))
    query = query.order_by(ExtrusionRun.recorded_at.desc())
    return PaginatedExtrusionRuns(**paginate(query, page, per_page, _to_read))
