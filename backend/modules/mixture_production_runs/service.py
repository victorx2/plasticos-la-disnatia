from datetime import date, datetime
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from modules.production.models import (
    AreaRequest,
    ExtrusionCoil,
    ExtrusionRun,
    MaterialRequest,
    MaterialRequestLine,
    MixtureProductionRun,
    TintaMixture,
    WorkOrder,
)


def _mixture_total_kg(mixture: TintaMixture) -> Decimal:
    return sum((Decimal(str(c.quantity)) for c in mixture.components), Decimal("0"))


def _produced_kg(
    mixture: TintaMixture,
    fully_used: bool,
    remaining_kg: Decimal | None,
) -> Decimal:
    total = _mixture_total_kg(mixture)
    if fully_used:
        return total
    remaining = remaining_kg if remaining_kg is not None else Decimal("0")
    return max(Decimal("0"), total - remaining)


def _coil_code(run_id: int) -> str:
    return f"BOB-MIX-{run_id:05d}-01"


def create_extrusion_from_mixture(
    db: Session,
    *,
    work_order_id: int,
    produced_kg: Decimal,
    mixture_production_run_id: int,
) -> ExtrusionRun:
    now = datetime.now()
    hour = now.hour
    if hour < 12:
        shift = "mañana"
    elif hour < 18:
        shift = "tarde"
    else:
        shift = "noche"
    run = ExtrusionRun(
        work_order_id=work_order_id,
        shift=shift,
        recorded_at=now,
        recorded_date=now.date(),
        machine="mezcla",
        target_kg=produced_kg,
        total_kg=produced_kg,
        mixture_production_run_id=mixture_production_run_id,
        status="completed",
    )
    db.add(run)
    db.flush()
    run.coils.append(
        ExtrusionCoil(
            microns=[0.0] * 7,
            kg=produced_kg,
            coil_code=_coil_code(run.id),
        )
    )
    return run


def create_inbound_warehouse_request(
    db: Session,
    *,
    work_order_id: int,
    work_code: str,
    mixture: TintaMixture,
    produced_kg: Decimal,
    notes_extra: str | None = None,
) -> MaterialRequest:
    desc = f"{mixture.output_sku} · {mixture.output_name}"
    notes = f"Entrada de mezcla producida — trabajo {work_code}"
    if notes_extra:
        notes = f"{notes} — {notes_extra}"
    req = MaterialRequest(
        status="pending",
        request_flow="inbound",
        originating_area="produccion",
        destination_areas=["almacen"],
        notes=notes,
        document_date=date.today(),
        work_order_id=work_order_id,
        kg_authorized=produced_kg,
        kg_dispatched=Decimal("0"),
        kg_remaining=produced_kg,
        requester_name="Producción",
        lines=[
            MaterialRequestLine(
                description=desc,
                quantity_requested=produced_kg,
                quantity_dispatched=Decimal("0"),
                unit="kg",
            )
        ],
    )
    db.add(req)
    db.flush()
    area = AreaRequest(
        area="almacen",
        title=f"Recibir mezcla — {work_code}",
        body=notes,
        status="pending",
        material_request_id=req.id,
        work_order_id=work_order_id,
        requester_name="Producción",
        insumos_origin="produccion_entrada",
    )
    db.add(area)
    return req


def begin_extrusion_from_mixture(
    db: Session, run: MixtureProductionRun
) -> tuple[ExtrusionRun, Decimal, Decimal]:
    """Inicia o reanuda extrusión. Retorna sesión, kg disponibles y kg despachados totales."""
    if run.status != "in_progress":
        raise ValueError("La produccion de mezcla no esta en progreso")
    mixture = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(TintaMixture.id == run.tinta_mixture_id)
        .first()
    )
    if not mixture:
        raise ValueError("Mezcla no encontrada")

    from modules.extrusion_runs.service import get_or_create_session
    from modules.tinta_mixtures.service import _extrusion_session_used_kg, get_submezcla_balance

    balance = get_submezcla_balance(db, run.work_order_id)
    kg_dispatched_total = (
        Decimal(balance["kg_dispatched"]) if balance else _mixture_total_kg(mixture)
    )
    kg_available = Decimal(balance["kg_available"]) if balance else kg_dispatched_total

    if kg_dispatched_total <= 0:
        raise ValueError("La mezcla no tiene kg registrados")
    if kg_available <= 0:
        raise ValueError("No quedan kg disponibles en la submezcla para este trabajo")

    if run.extrusion_run_id:
        linked = db.get(ExtrusionRun, run.extrusion_run_id)
        if linked and linked.status == "in_progress":
            linked.target_kg = kg_dispatched_total
            db.flush()
            used = _extrusion_session_used_kg(linked)
            available = max(Decimal("0"), kg_dispatched_total - used)
            return linked, available, kg_dispatched_total
        if linked and linked.status == "completed":
            run.extrusion_run_id = None
            db.flush()

    session = get_or_create_session(
        db,
        run.work_order_id,
        target_kg=kg_dispatched_total,
        mixture_production_run_id=run.id,
    )
    session.target_kg = kg_dispatched_total
    run.extrusion_run_id = session.id

    work_order = run.work_order or db.get(WorkOrder, run.work_order_id)
    if work_order and (work_order.board_stage or "") == "mezcla":
        work_order.board_stage = "extrusion"

    return session, kg_available, kg_dispatched_total


def complete_mixture_from_extrusion_session(db: Session, session: ExtrusionRun) -> Decimal:
    if not session.mixture_production_run_id:
        return Decimal("0")
    mix_run = db.get(MixtureProductionRun, session.mixture_production_run_id)
    if not mix_run:
        return Decimal("0")

    from modules.tinta_mixtures.service import _extrusion_session_used_kg, get_submezcla_balance

    consumed = _extrusion_session_used_kg(session)
    mix_run.produced_kg = consumed
    mix_run.extrusion_run_id = session.id

    if session.reassigned_work_order_id:
        mix_run.used_in_work_order_id = session.reassigned_work_order_id

    balance = get_submezcla_balance(db, mix_run.work_order_id)
    remaining = Decimal(balance["kg_available"]) if balance else Decimal("0")

    if remaining > Decimal("0.001"):
        mix_run.fully_used = False
        mix_run.remaining_kg = remaining
        mix_run.status = "in_progress"
        mix_run.completed_at = None
        return remaining

    mix_run.fully_used = True
    mix_run.remaining_kg = None
    mix_run.status = "completed"
    mix_run.completed_at = datetime.now()
    return Decimal("0")


def finalize_mixture_production(
    db: Session,
    run: MixtureProductionRun,
    *,
    fully_used: bool,
    remaining_kg: Decimal | None,
    reason: str | None,
    used_in_work_order_id: int | None,
) -> MixtureProductionRun:
    mixture = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(TintaMixture.id == run.tinta_mixture_id)
        .first()
    )
    if not mixture:
        raise ValueError("Mezcla no encontrada")

    produced = _produced_kg(mixture, fully_used, remaining_kg)
    if produced <= 0 and fully_used:
        produced = _mixture_total_kg(mixture)

    run.fully_used = fully_used
    run.remaining_kg = remaining_kg
    run.reason = reason
    run.used_in_work_order_id = used_in_work_order_id
    run.produced_kg = produced
    run.status = "completed"
    run.completed_at = datetime.now()

    work_order = run.work_order or db.get(WorkOrder, run.work_order_id)
    work_code = work_order.code if work_order else str(run.work_order_id)
    notes_extra = reason if reason else None

    if run.extrusion_run_id:
        linked = db.get(ExtrusionRun, run.extrusion_run_id)
        if linked:
            run.produced_kg = linked.total_kg or produced
            return run

    # Entrada a almacén y registro legacy solo si no hay sesión de extrusión vinculada.
    if produced > 0 and not used_in_work_order_id:
        extrusion = create_extrusion_from_mixture(
            db,
            work_order_id=run.work_order_id,
            produced_kg=produced,
            mixture_production_run_id=run.id,
        )
        run.extrusion_run_id = extrusion.id
        inbound = create_inbound_warehouse_request(
            db,
            work_order_id=run.work_order_id,
            work_code=work_code,
            mixture=mixture,
            produced_kg=produced,
            notes_extra=notes_extra,
        )
        run.inbound_material_request_id = inbound.id

    return run


def return_submezcla_kg_to_warehouse(
    db: Session,
    *,
    work_order_id: int,
    kg: Decimal,
    notes: str | None = None,
) -> MaterialRequest:
    from modules.tinta_mixtures.service import (
        find_latest_submezcla,
        get_submezcla_balance,
        mixture_total_kg,
        refresh_extrusion_target_for_submezcla,
    )

    if kg <= 0:
        raise ValueError("Indique kg mayores a cero")

    balance = get_submezcla_balance(db, work_order_id)
    if not balance:
        raise ValueError("No hay submezcla para este trabajo")

    available = Decimal(balance["kg_available"])
    if kg > available + Decimal("0.001"):
        raise ValueError(f"Solo hay {available} kg disponibles en submezcla")

    sub = find_latest_submezcla(db, work_order_id)
    if not sub:
        raise ValueError("Submezcla no encontrada")

    total = mixture_total_kg(sub.components)
    if total <= 0:
        raise ValueError("Submezcla sin componentes")

    factor = max(Decimal("0"), (total - kg) / total)
    for comp in sub.components:
        qty = Decimal(str(comp.quantity))
        comp.quantity = max(Decimal("0"), qty * factor).quantize(Decimal("0.001"))

    work_order = db.get(WorkOrder, work_order_id)
    work_code = work_order.code if work_order else str(work_order_id)

    inbound = create_inbound_warehouse_request(
        db,
        work_order_id=work_order_id,
        work_code=work_code,
        mixture=sub,
        produced_kg=kg,
        notes_extra=notes or "Mezcla ensacada devuelta a almacén",
    )
    refresh_extrusion_target_for_submezcla(db, sub.id)
    db.flush()
    return inbound
