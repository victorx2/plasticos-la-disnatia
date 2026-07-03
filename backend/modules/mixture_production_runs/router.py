from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.mixture_production_runs.schemas import (
    MixtureBeginExtrusionRead,
    MixtureProductionCompleteInput,
    MixtureProductionHistoryEntry,
    MixtureProductionRunInput,
    MixtureProductionRunRead,
    MixtureReturnToWarehouseInput,
    MixtureReturnToWarehouseRead,
    PaginatedMixtureProductionRuns,
)
from modules.mixture_production_runs.service import (
    begin_extrusion_from_mixture,
    finalize_mixture_production,
    return_submezcla_kg_to_warehouse,
)
from modules.production.models import ExtrusionRun, MixtureProductionRun, TintaMixture, WorkOrder

router = APIRouter(tags=["mixture-production-runs"])


def _to_read(run: MixtureProductionRun) -> MixtureProductionRunRead:
    used_code = None
    if run.used_in_work_order_id and run.used_in_work_order:
        used_code = run.used_in_work_order.code
    return MixtureProductionRunRead(
        id=run.id,
        tinta_mixture_id=run.tinta_mixture_id,
        work_order_id=run.work_order_id,
        status=run.status,
        fully_used=run.fully_used,
        remaining_kg=str(run.remaining_kg) if run.remaining_kg is not None else None,
        reason=run.reason,
        used_in_work_order_id=run.used_in_work_order_id,
        produced_kg=str(run.produced_kg) if run.produced_kg is not None else None,
        extrusion_run_id=run.extrusion_run_id,
        inbound_material_request_id=run.inbound_material_request_id,
        mixture_output_name=run.mixture.output_name if run.mixture else None,
        mixture_output_sku=run.mixture.output_sku if run.mixture else None,
        work_order_code=run.work_order.code if run.work_order else None,
        used_in_work_order_code=used_code,
        started_at=run.started_at,
        completed_at=run.completed_at,
    )


@router.get("/mixture-production-runs", response_model=PaginatedMixtureProductionRuns)
def list_mixture_production_runs(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    work_order_id: int | None = None,
    status: str | None = None,
) -> PaginatedMixtureProductionRuns:
    query = db.query(MixtureProductionRun).options(
        joinedload(MixtureProductionRun.mixture),
        joinedload(MixtureProductionRun.work_order),
        joinedload(MixtureProductionRun.used_in_work_order),
    )
    if work_order_id:
        query = query.filter(MixtureProductionRun.work_order_id == work_order_id)
    if status:
        query = query.filter(MixtureProductionRun.status == status)
    query = query.order_by(MixtureProductionRun.id.desc())
    return PaginatedMixtureProductionRuns(**paginate(query, page, per_page, _to_read))


@router.get("/mixture-production-runs/history", response_model=list[MixtureProductionHistoryEntry])
def mixture_production_history(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int = Query(..., ge=1),
) -> list[MixtureProductionHistoryEntry]:
    runs = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
            joinedload(MixtureProductionRun.extrusion_run),
        )
        .filter(
            or_(
                MixtureProductionRun.work_order_id == work_order_id,
                MixtureProductionRun.used_in_work_order_id == work_order_id,
            )
        )
        .order_by(MixtureProductionRun.completed_at.desc(), MixtureProductionRun.id.desc())
        .all()
    )
    reassigned_linked = (
        db.query(MixtureProductionRun)
        .join(ExtrusionRun, MixtureProductionRun.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
            joinedload(MixtureProductionRun.extrusion_run),
        )
        .filter(ExtrusionRun.reassigned_work_order_id == work_order_id)
        .order_by(MixtureProductionRun.completed_at.desc(), MixtureProductionRun.id.desc())
        .all()
    )
    entries: list[MixtureProductionHistoryEntry] = []
    seen_ids: set[int] = set()
    for run in [*runs, *reassigned_linked]:
        if run.id in seen_ids:
            continue
        seen_ids.add(run.id)
        base = _to_read(run)
        if run.work_order_id == work_order_id and not (
            run.used_in_work_order_id == work_order_id
            or (
                run.extrusion_run
                and run.extrusion_run.reassigned_work_order_id == work_order_id
            )
        ):
            role = "origen"
        elif (
            run.used_in_work_order_id == work_order_id
            or (
                run.extrusion_run
                and run.extrusion_run.reassigned_work_order_id == work_order_id
            )
        ):
            role = "destino_cruzado"
        else:
            role = "relacionado"
        entries.append(MixtureProductionHistoryEntry(**base.model_dump(), history_role=role))
    return entries


@router.post("/mixture-production-runs", response_model=MixtureProductionRunRead, status_code=201)
def start_mixture_production(
    payload: MixtureProductionRunInput,
    db: Annotated[Session, Depends(get_db)],
) -> MixtureProductionRunRead:
    mixture = db.get(TintaMixture, payload.tinta_mixture_id)
    wo = db.get(WorkOrder, payload.work_order_id)
    if not mixture or not wo:
        raise HTTPException(status_code=422, detail="Mezcla o trabajo no válido")
    if mixture.work_order_id and mixture.work_order_id != payload.work_order_id:
        raise HTTPException(status_code=422, detail="La mezcla no pertenece a este trabajo")
    if mixture.mixture_kind == "mezcla":
        raise HTTPException(
            status_code=422,
            detail="La mezcla completa es solo referencia. Inicie extrusión desde una submezcla despachada.",
        )
    existing = (
        db.query(MixtureProductionRun)
        .filter(
            MixtureProductionRun.work_order_id == payload.work_order_id,
            MixtureProductionRun.status == "in_progress",
        )
        .order_by(MixtureProductionRun.id.desc())
        .first()
    )
    if existing:
        run = (
            db.query(MixtureProductionRun)
            .options(
                joinedload(MixtureProductionRun.mixture),
                joinedload(MixtureProductionRun.work_order),
                joinedload(MixtureProductionRun.used_in_work_order),
            )
            .filter(MixtureProductionRun.id == existing.id)
            .first()
        )
        return _to_read(run)
    run = MixtureProductionRun(
        tinta_mixture_id=payload.tinta_mixture_id,
        work_order_id=payload.work_order_id,
        status="in_progress",
    )
    db.add(run)
    db.commit()
    run = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
        )
        .filter(MixtureProductionRun.id == run.id)
        .first()
    )
    return _to_read(run)


@router.post(
    "/mixture-production-runs/{run_id}/begin-extrusion",
    response_model=MixtureBeginExtrusionRead,
    status_code=201,
)
def begin_mixture_extrusion(
    run_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> MixtureBeginExtrusionRead:
    run = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
        )
        .filter(MixtureProductionRun.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    try:
        session, available_kg, dispatched_kg = begin_extrusion_from_mixture(db, run)
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.refresh(run)
    run = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
        )
        .filter(MixtureProductionRun.id == run_id)
        .first()
    )
    return MixtureBeginExtrusionRead(
        mixture_run=_to_read(run),
        mixture_initial_kg=str(available_kg),
        mixture_available_kg=str(available_kg),
        mixture_dispatched_kg=str(dispatched_kg),
        extrusion_session_id=session.id,
        work_order_id=run.work_order_id,
    )


@router.post("/mixture-production-runs/{run_id}/complete", response_model=MixtureProductionRunRead)
def complete_mixture_production(
    run_id: int,
    payload: MixtureProductionCompleteInput,
    db: Annotated[Session, Depends(get_db)],
) -> MixtureProductionRunRead:
    run = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
        )
        .filter(MixtureProductionRun.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if run.status == "completed":
        raise HTTPException(status_code=422, detail="Ya está culminada")
    if payload.used_in_work_order_id:
        other = db.get(WorkOrder, payload.used_in_work_order_id)
        if not other:
            raise HTTPException(status_code=422, detail="Trabajo destino no válido")
    remaining = (
        Decimal(str(payload.remaining_kg)) if payload.remaining_kg is not None else None
    )
    try:
        finalize_mixture_production(
            db,
            run,
            fully_used=payload.fully_used,
            remaining_kg=remaining,
            reason=payload.reason,
            used_in_work_order_id=payload.used_in_work_order_id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.refresh(run)
    run = (
        db.query(MixtureProductionRun)
        .options(
            joinedload(MixtureProductionRun.mixture),
            joinedload(MixtureProductionRun.work_order),
            joinedload(MixtureProductionRun.used_in_work_order),
        )
        .filter(MixtureProductionRun.id == run_id)
        .first()
    )
    return _to_read(run)


@router.post(
    "/mixture-production-runs/{run_id}/return-to-warehouse",
    response_model=MixtureReturnToWarehouseRead,
    status_code=201,
)
def return_mixture_to_warehouse(
    run_id: int,
    payload: MixtureReturnToWarehouseInput,
    db: Annotated[Session, Depends(get_db)],
) -> MixtureReturnToWarehouseRead:
    run = (
        db.query(MixtureProductionRun)
        .options(joinedload(MixtureProductionRun.work_order))
        .filter(MixtureProductionRun.id == run_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    kg = Decimal(str(payload.kg))
    try:
        inbound = return_submezcla_kg_to_warehouse(
            db,
            work_order_id=run.work_order_id,
            kg=kg,
            notes=payload.notes,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    from modules.tinta_mixtures.service import get_submezcla_balance

    balance = get_submezcla_balance(db, run.work_order_id)
    remaining = Decimal(balance["kg_available"]) if balance else Decimal("0")
    return MixtureReturnToWarehouseRead(
        material_request_id=inbound.id,
        kg=str(kg),
        kg_remaining=str(remaining),
    )
