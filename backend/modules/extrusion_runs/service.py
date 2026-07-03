from datetime import date, datetime
from decimal import Decimal
import re

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from modules.production.models import (
    ExtrusionCoil,
    ExtrusionRun,
    ExtrusionShiftSegment,
    ExtrusionWaste,
    WorkOrder,
)

MAX_COILS = 99
VALID_MACHINES = frozenset({"1", "2", "3", "4", "5", "6", "7"})


def normalize_machine(raw: str | None) -> str | None:
    if raw is None:
        return None
    text = raw.strip()
    if not text:
        return None
    if text in VALID_MACHINES:
        return text
    match = re.match(
        r"^(?:l[ií]nea|linea|l|m[aá]quina|maquina|m|e)?\s*(\d+)$",
        text,
        re.IGNORECASE,
    )
    if match and match.group(1) in VALID_MACHINES:
        return match.group(1)
    raise ValueError("Máquina debe ser Línea 1 a Línea 7")


def _coil_code(run_id: int, segment_id: int, index: int) -> str:
    return f"BOB-{run_id:05d}-S{segment_id:03d}-{index:02d}"


def _legacy_coil_code(run_id: int, index: int) -> str:
    return f"BOB-{run_id:05d}-{index:02d}"


def validate_work_orders(
    db: Session,
    work_order_id: int,
    reassigned_work_order_id: int | None,
) -> None:
    wo = db.get(WorkOrder, work_order_id)
    if not wo:
        raise ValueError("Trabajo en planta no valido")
    if reassigned_work_order_id:
        other = db.get(WorkOrder, reassigned_work_order_id)
        if not other:
            raise ValueError("Trabajo destino para cambio de orden no valido")


def production_work_order_id(run: ExtrusionRun) -> int:
    """Trabajo al que se atribuye la producción (destino si hubo cruce de mezcla)."""
    return run.reassigned_work_order_id or run.work_order_id


def production_work_order(run: ExtrusionRun) -> WorkOrder | None:
    if run.reassigned_work_order_id and run.reassigned_work_order:
        return run.reassigned_work_order
    return run.work_order


def extrusion_production_filter(work_order_id: int):
    """Runs cuya producción se atribuye al trabajo (destino si hubo cruce de mezcla)."""
    return or_(
        and_(
            ExtrusionRun.work_order_id == work_order_id,
            ExtrusionRun.reassigned_work_order_id.is_(None),
        ),
        ExtrusionRun.reassigned_work_order_id == work_order_id,
    )


def extrusion_production_filter_many(work_order_ids: list[int]):
    if not work_order_ids:
        return ExtrusionRun.id == -1
    return or_(
        and_(
            ExtrusionRun.work_order_id.in_(work_order_ids),
            ExtrusionRun.reassigned_work_order_id.is_(None),
        ),
        ExtrusionRun.reassigned_work_order_id.in_(work_order_ids),
    )


def get_active_session(
    db: Session,
    work_order_id: int,
    on_date: date | None = None,
) -> ExtrusionRun | None:
    """Sesión abierta del trabajo (origen o destino si hubo cruce de mezcla)."""
    query = db.query(ExtrusionRun).filter(
        ExtrusionRun.status == "in_progress",
        or_(
            ExtrusionRun.work_order_id == work_order_id,
            ExtrusionRun.reassigned_work_order_id == work_order_id,
        ),
    )
    if on_date is not None:
        query = query.filter(ExtrusionRun.recorded_date == on_date)
    return query.order_by(ExtrusionRun.id.desc()).first()


def get_or_create_session(
    db: Session,
    work_order_id: int,
    *,
    machine: str | None = None,
    target_kg: Decimal | None = None,
    on_date: date | None = None,
    mixture_production_run_id: int | None = None,
) -> ExtrusionRun:
    validate_work_orders(db, work_order_id, None)
    existing = get_active_session(db, work_order_id, None)
    if existing:
        if machine:
            existing.machine = normalize_machine(machine)
        if target_kg is not None and existing.target_kg is None:
            existing.target_kg = target_kg
        if mixture_production_run_id is not None and existing.mixture_production_run_id is None:
            existing.mixture_production_run_id = mixture_production_run_id
        return existing
    now = datetime.now()
    target = on_date or date.today()
    run = ExtrusionRun(
        work_order_id=work_order_id,
        shift="sesion",
        recorded_at=now,
        recorded_date=target,
        machine=normalize_machine(machine) if machine else None,
        target_kg=target_kg,
        total_kg=Decimal("0"),
        total_effective_minutes=Decimal("0"),
        status="in_progress",
        mixture_production_run_id=mixture_production_run_id,
    )
    db.add(run)
    db.flush()
    return run


def coils_data_from_count(coils_count: int, microns: list | None = None) -> list:
    """Bobinas sin peso — el peso se asigna en despacho."""
    if coils_count < 1:
        raise ValueError("Indique cantidad de bobinas")
    if coils_count > MAX_COILS:
        raise ValueError(f"Maximo {MAX_COILS} bobinas por tramo")
    default_microns = microns if microns else [0.0] * 7
    return [
        type("CoilPayload", (), {"kg": Decimal("0"), "microns": default_microns})()
        for _ in range(coils_count)
    ]


def coils_data_from_produced_kg(produced_kg: Decimal, coils_count: int) -> list:
    if coils_count < 1:
        raise ValueError("Cantidad de bobinas debe ser al menos 1")
    if coils_count > MAX_COILS:
        raise ValueError(f"Maximo {MAX_COILS} bobinas por tramo")
    if produced_kg <= 0:
        raise ValueError("Kg producidos debe ser mayor a cero")
    per_coil = (produced_kg / Decimal(coils_count)).quantize(Decimal("0.001"))
    coils: list = []
    assigned = Decimal("0")
    for index in range(coils_count):
        if index == coils_count - 1:
            kg = produced_kg - assigned
        else:
            kg = per_coil
            assigned += kg
        coils.append(type("CoilPayload", (), {"kg": kg, "microns": [0.0] * 7})())
    return coils


def _apply_coils_to_segment(
    segment: ExtrusionShiftSegment,
    run: ExtrusionRun,
    coils_data: list,
    db: Session,
    *,
    require_kg: bool = True,
) -> Decimal:
    if len(coils_data) > MAX_COILS:
        raise ValueError(f"Maximo {MAX_COILS} bobinas por tramo")
    total = Decimal("0")
    index = 0
    for coil in coils_data:
        kg = Decimal(str(coil.kg))
        index += 1
        microns = [float(m) for m in coil.microns]
        if kg <= 0:
            db.add(
                ExtrusionCoil(
                    extrusion_run_id=run.id,
                    segment_id=segment.id,
                    microns=microns,
                    kg=Decimal("0"),
                    coil_code=_coil_code(run.id, segment.id, index),
                )
            )
            continue
        total += kg
        db.add(
            ExtrusionCoil(
                extrusion_run_id=run.id,
                segment_id=segment.id,
                microns=microns,
                kg=kg,
                coil_code=_coil_code(run.id, segment.id, index),
            )
        )
    if require_kg and total <= 0 and index == 0:
        raise ValueError("Debe registrar al menos una bobina")
    segment.total_kg = total
    return total


def _apply_waste_to_segment(
    segment: ExtrusionShiftSegment,
    run: ExtrusionRun,
    waste_data: list | None,
    db: Session,
) -> None:
    if not waste_data:
        return
    from modules.materials.models import InventoryMovement, Material

    for item in waste_data:
        waste_kg = Decimal(str(item.waste_kg))
        if waste_kg <= 0:
            continue
        waste_type = (item.waste_type or "").strip().lower()
        if waste_type not in ("refil", "transparente"):
            raise ValueError("Tipo de desperdicio debe ser refil o transparente")
        db.add(
            ExtrusionWaste(
                extrusion_run_id=run.id,
                segment_id=segment.id,
                waste_type=waste_type,
                waste_kg=waste_kg,
            )
        )
        sku = f"DESP-{waste_type.upper()}"
        material = db.query(Material).filter(Material.sku == sku).first()
        if not material:
            material = Material(
                sku=sku,
                name=f"Desperdicio extrusion ({waste_type})",
                inventory_area="desperdicio",
                unit="kg",
                quantity_on_hand=Decimal("0"),
            )
            db.add(material)
            db.flush()
        material.quantity_on_hand += waste_kg
        db.add(
            InventoryMovement(
                material_id=material.id,
                movement_type="extrusion_waste",
                quantity=waste_kg,
                reference_type="extrusion_segment",
                reference_id=segment.id,
                occurred_at=datetime.now(),
                reason=f"Desperdicio {waste_type} tramo #{segment.id}",
            )
        )


def recalc_session_totals(run: ExtrusionRun) -> None:
    run.total_kg = sum((s.total_kg for s in run.segments), Decimal("0"))
    run.bolsones_kg = sum((s.bolsones_kg for s in run.segments), Decimal("0"))
    run.fallas_kg = sum((s.fallas_kg for s in run.segments), Decimal("0"))
    run.core_kg = sum((s.core_kg for s in run.segments), Decimal("0"))
    run.total_effective_minutes = sum((s.effective_minutes for s in run.segments), Decimal("0"))


def add_segment(
    db: Session,
    run: ExtrusionRun,
    *,
    shift: str,
    operator_name: str | None,
    started_at: datetime | None,
    ended_at: datetime | None,
    effective_minutes: Decimal,
    production_format: str | None,
    machine: str | None,
    coils_data: list,
    waste_data: list | None,
    bolsones_kg: Decimal | None = None,
    fallas_kg: Decimal | None = None,
    core_kg: Decimal | None = None,
    require_kg: bool = False,
    produced_kg: Decimal | None = None,
    coils_count: int | None = None,
) -> ExtrusionShiftSegment:
    if run.status != "in_progress":
        raise ValueError("La sesion de extrusion ya esta cerrada")
    if produced_kg is not None and coils_count is not None:
        coils_data = coils_data_from_produced_kg(produced_kg, coils_count)
        require_kg = True
    elif coils_count is not None and coils_count > 0 and not coils_data:
        coils_data = coils_data_from_count(coils_count)
        require_kg = False
    if effective_minutes <= 0 and not coils_data and not waste_data:
        raise ValueError("Indique duracion del temporizador, kg producidos o desperdicio")
    segment = ExtrusionShiftSegment(
        extrusion_run_id=run.id,
        shift=shift,
        operator_name=operator_name,
        started_at=started_at,
        ended_at=ended_at or datetime.now(),
        effective_minutes=effective_minutes,
        production_format=production_format,
        machine=normalize_machine(machine) if machine else None,
        total_kg=Decimal("0"),
        bolsones_kg=bolsones_kg or Decimal("0"),
        fallas_kg=fallas_kg or Decimal("0"),
        core_kg=core_kg or Decimal("0"),
    )
    db.add(segment)
    db.flush()
    has_coils = bool(coils_data)
    if has_coils:
        _apply_coils_to_segment(segment, run, coils_data, db, require_kg=require_kg)
    _apply_waste_to_segment(segment, run, waste_data, db)
    db.refresh(run)
    recalc_session_totals(run)
    return segment


def close_session(
    db: Session,
    run: ExtrusionRun,
    *,
    last_segment_kwargs: dict | None = None,
    complete_mixture: bool = False,
    mark_work_completed: bool = False,
    production_route: str | None = None,
) -> tuple[ExtrusionRun, Decimal | None]:
    """Cierra sesión. Devuelve (run, mixture_remaining_kg) si aplica."""
    if run.status == "completed":
        raise ValueError("La sesion ya esta cerrada")
    if last_segment_kwargs:
        add_segment(db, run, **last_segment_kwargs)
    if not run.segments:
        raise ValueError("No hay tramos registrados para cerrar la produccion")
    run.status = "completed"
    run.ended_at = datetime.now()
    recalc_session_totals(run)

    if production_route in ("dispatch", "sealing"):
        target_id = production_work_order_id(run)
        wo = db.get(WorkOrder, target_id)
        if wo:
            wo.production_route = production_route

    mixture_remaining: Decimal | None = None
    if complete_mixture and run.mixture_production_run_id:
        from modules.mixture_production_runs.service import complete_mixture_from_extrusion_session

        mixture_remaining = complete_mixture_from_extrusion_session(db, run)

    if mark_work_completed:
        target_id = production_work_order_id(run)
        wo = db.get(WorkOrder, target_id)
        if wo:
            wo.board_stage = "completada"
            wo.status = "fulfilled"
            if wo.client_order_id:
                from modules.client_orders.service import try_fulfill_client_order

                try_fulfill_client_order(db, wo.client_order_id)

    return run, mixture_remaining


def _apply_coils(run: ExtrusionRun, coils_data: list, db: Session) -> Decimal:
    if len(coils_data) > MAX_COILS:
        raise ValueError(f"Maximo {MAX_COILS} bobinas por registro")
    run.coils.clear()
    total = Decimal("0")
    for index, coil in enumerate(coils_data, start=1):
        kg = Decimal(str(coil.kg))
        if kg <= 0:
            continue
        total += kg
        run.coils.append(
            ExtrusionCoil(
                microns=[float(m) for m in coil.microns],
                kg=kg,
                coil_code=_legacy_coil_code(run.id, index),
            )
        )
    if total <= 0:
        raise ValueError("Debe registrar al menos una bobina con kg mayor a cero")
    run.total_kg = total
    return total


def _apply_waste(run: ExtrusionRun, waste_data: list | None, db: Session) -> None:
    run.waste_lines.clear()
    if not waste_data:
        return
    from modules.materials.models import InventoryMovement, Material

    for item in waste_data:
        waste_kg = Decimal(str(item.waste_kg))
        if waste_kg <= 0:
            continue
        waste_type = (item.waste_type or "").strip().lower()
        if waste_type not in ("refil", "transparente"):
            raise ValueError("Tipo de desperdicio debe ser refil o transparente")
        run.waste_lines.append(
            ExtrusionWaste(
                waste_type=waste_type,
                waste_kg=waste_kg,
            )
        )
        sku = f"DESP-{waste_type.upper()}"
        material = db.query(Material).filter(Material.sku == sku).first()
        if not material:
            material = Material(
                sku=sku,
                name=f"Desperdicio extrusion ({waste_type})",
                inventory_area="desperdicio",
                unit="kg",
                quantity_on_hand=Decimal("0"),
            )
            db.add(material)
            db.flush()
        material.quantity_on_hand += waste_kg
        db.add(
            InventoryMovement(
                material_id=material.id,
                movement_type="extrusion_waste",
                quantity=waste_kg,
                reference_type="extrusion_run",
                reference_id=run.id,
                occurred_at=datetime.now(),
                reason=f"Desperdicio {waste_type} extrusion #{run.id}",
            )
        )
