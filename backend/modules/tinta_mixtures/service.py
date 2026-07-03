from collections import defaultdict
from decimal import Decimal

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session, joinedload

from modules.production.models import (
    ExtrusionRun,
    ExtrusionShiftSegment,
    MaterialRequest,
    MaterialRequestLine,
    MixtureProductionRun,
    TintaMixture,
    TintaMixtureComponent,
    WorkOrder,
)

_OPEN_REQUEST_STATUSES = frozenset({"pending", "authorized", "partial"})


def _load_work(db: Session, work_order_id: int) -> WorkOrder | None:
    return (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.product))
        .filter(WorkOrder.id == work_order_id)
        .first()
    )


def _work_output_name(work: WorkOrder) -> str:
    if work.product and work.product.name:
        return work.product.name
    return work.code


def _components_from_request_lines(
    lines: list[MaterialRequestLine],
    *,
    quantity_attr: str,
) -> list[TintaMixtureComponent]:
    components: list[TintaMixtureComponent] = []
    for line in lines:
        qty = Decimal(str(getattr(line, quantity_attr)))
        if line.material_id and qty > 0:
            components.append(
                TintaMixtureComponent(
                    material_id=line.material_id,
                    quantity=qty,
                )
            )
    return components


def find_principal_mezcla(db: Session, work_order_id: int) -> TintaMixture | None:
    """Mezcla principal (receta / cupo) — una por trabajo en planta."""
    principal = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components).joinedload(TintaMixtureComponent.material))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.mixture_kind == "mezcla",
        )
        .order_by(TintaMixture.id.asc())
        .first()
    )
    if principal:
        return principal

    # Legacy: mezcla creada antes de mixture_kind o sin marcar
    legacy = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components).joinedload(TintaMixtureComponent.material))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.material_request_id.isnot(None),
        )
        .order_by(TintaMixture.id.asc())
        .first()
    )
    if legacy and legacy.mixture_kind != "submezcla":
        legacy.mixture_kind = "mezcla"
        db.flush()
        return legacy
    return None


def find_mezcla_for_request(db: Session, req: MaterialRequest) -> TintaMixture | None:
    if req.work_order_id:
        principal = find_principal_mezcla(db, req.work_order_id)
        if principal:
            return principal
    return (
        db.query(TintaMixture)
        .filter(
            TintaMixture.material_request_id == req.id,
            TintaMixture.mixture_kind == "mezcla",
        )
        .first()
    )


def mixture_total_kg(components: list[TintaMixtureComponent]) -> Decimal:
    total = Decimal("0")
    for component in components:
        total += Decimal(str(component.quantity))
    return total


def _first_material_request(db: Session, work_order_id: int) -> MaterialRequest | None:
    return (
        db.query(MaterialRequest)
        .options(joinedload(MaterialRequest.lines))
        .filter(MaterialRequest.work_order_id == work_order_id)
        .order_by(MaterialRequest.id.asc())
        .first()
    )


def _initial_recipe_by_material(db: Session, work_order_id: int) -> dict[int, Decimal]:
    first_req = _first_material_request(db, work_order_id)
    if not first_req:
        return {}
    totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for line in first_req.lines:
        if line.material_id:
            totals[line.material_id] += Decimal(str(line.quantity_requested))
    return dict(totals)


def _submezcla_totals_by_material(db: Session, work_order_id: int) -> dict[int, Decimal]:
    totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    subs = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.mixture_kind == "submezcla",
        )
        .all()
    )
    for sub in subs:
        for component in sub.components:
            totals[component.material_id] += Decimal(str(component.quantity))
    return dict(totals)


def _pending_first_request_by_material(
    db: Session,
    work_order_id: int,
) -> dict[int, Decimal]:
    """Kg de la primera solicitud aún no despachados (sigue abierta)."""
    first_req = _first_material_request(db, work_order_id)
    if not first_req or first_req.status not in _OPEN_REQUEST_STATUSES:
        return {}

    totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for line in first_req.lines:
        if not line.material_id:
            continue
        pending = Decimal(str(line.quantity_requested)) - Decimal(str(line.quantity_dispatched or 0))
        if pending > 0:
            totals[line.material_id] += pending
    return dict(totals)


def first_open_request_pending_detail(db: Session, work_order_id: int) -> tuple[int, str] | None:
    """Si hay alguna solicitud abierta con líneas pendientes, devuelve (id, mensaje)."""
    requests = (
        db.query(MaterialRequest)
        .options(joinedload(MaterialRequest.lines))
        .filter(
            MaterialRequest.work_order_id == work_order_id,
            MaterialRequest.status.in_(_OPEN_REQUEST_STATUSES),
        )
        .order_by(MaterialRequest.id.desc())
        .all()
    )
    for req in requests:
        pending_kg = Decimal("0")
        for line in req.lines:
            pending = Decimal(str(line.quantity_requested)) - Decimal(str(line.quantity_dispatched or 0))
            if pending > 0:
                pending_kg += pending
        if pending_kg > 0:
            if getattr(req, "is_replenishment", False):
                return (
                    req.id,
                    f"Ya existe una solicitud de reposición (#{req.id}) con {pending_kg} kg pendientes "
                    "de despacho en almacén. Use Solicitudes entre áreas para despacharla antes de crear otra.",
                )
            return (
                req.id,
                f"Ya existe una solicitud abierta (#{req.id}) con material pendiente de despacho. "
                "Use Solicitudes entre áreas e ingrese a esa solicitud para enviarla a almacén, "
                "o ciérrela antes de crear otra.",
            )
    return None


def _pending_follow_up_by_material(
    db: Session,
    work_order_id: int,
    *,
    exclude_request_id: int | None = None,
) -> dict[int, Decimal]:
    first_req = _first_material_request(db, work_order_id)
    if not first_req:
        return {}

    totals: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    requests = (
        db.query(MaterialRequest)
        .options(joinedload(MaterialRequest.lines))
        .filter(
            MaterialRequest.work_order_id == work_order_id,
            MaterialRequest.id != first_req.id,
            MaterialRequest.status.in_(_OPEN_REQUEST_STATUSES),
        )
        .all()
    )
    for req in requests:
        if exclude_request_id and req.id == exclude_request_id:
            continue
        if getattr(req, "is_replenishment", False):
            continue
        for line in req.lines:
            if not line.material_id:
                continue
            pending = Decimal(str(line.quantity_requested)) - Decimal(str(line.quantity_dispatched or 0))
            if pending > 0:
                totals[line.material_id] += pending
    return dict(totals)


def compute_principal_remaining_by_material(
    db: Session,
    work_order_id: int,
    *,
    exclude_request_id: int | None = None,
) -> dict[int, Decimal]:
    initial = _initial_recipe_by_material(db, work_order_id)
    if not initial:
        return {}

    sub = _submezcla_totals_by_material(db, work_order_id)
    pending_first = _pending_first_request_by_material(db, work_order_id)
    pending = _pending_follow_up_by_material(
        db, work_order_id, exclude_request_id=exclude_request_id
    )

    remaining: dict[int, Decimal] = {}
    for material_id, init_qty in initial.items():
        left = (
            init_qty
            - sub.get(material_id, Decimal("0"))
            - pending_first.get(material_id, Decimal("0"))
            - pending.get(material_id, Decimal("0"))
        )
        remaining[material_id] = max(Decimal("0"), left)
    return remaining


def recompute_principal_components(db: Session, work_order_id: int) -> TintaMixture | None:
    """Sincroniza componentes de la mezcla principal con despachos y solicitudes abiertas."""
    principal = find_principal_mezcla(db, work_order_id)
    if not principal:
        return None

    remaining = compute_principal_remaining_by_material(db, work_order_id)
    if not remaining:
        return principal

    comp_map = {c.material_id: c for c in principal.components}
    for material_id, qty in remaining.items():
        component = comp_map.get(material_id)
        if component:
            component.quantity = qty
        elif qty > 0:
            principal.components.append(
                TintaMixtureComponent(material_id=material_id, quantity=qty)
            )

    for component in list(principal.components):
        if component.material_id not in remaining:
            component.quantity = Decimal("0")

    db.flush()
    return principal


def sum_submezcla_dispatched_kg(db: Session, work_order_id: int, parent_id: int | None) -> Decimal:
    query = db.query(TintaMixture).options(joinedload(TintaMixture.components)).filter(
        TintaMixture.work_order_id == work_order_id,
        TintaMixture.mixture_kind == "submezcla",
    )
    if parent_id:
        linked = query.filter(TintaMixture.parent_mixture_id == parent_id).all()
        if linked:
            total = Decimal("0")
            for sub in linked:
                total += mixture_total_kg(sub.components)
            return total
    subs = query.all()
    total = Decimal("0")
    for sub in subs:
        total += mixture_total_kg(sub.components)
    return total


def validate_follow_up_request(
    db: Session,
    work_order_id: int,
    lines: list[MaterialRequestLine],
    *,
    exclude_request_id: int | None = None,
) -> TintaMixture:
    principal = find_principal_mezcla(db, work_order_id)
    if not principal:
        raise ValueError("No hay mezcla principal para este trabajo")

    open_pending = first_open_request_pending_detail(db, work_order_id)
    if open_pending and (exclude_request_id is None or open_pending[0] != exclude_request_id):
        raise ValueError(open_pending[1])

    remaining = compute_principal_remaining_by_material(
        db, work_order_id, exclude_request_id=exclude_request_id
    )
    if not remaining:
        raise ValueError("No hay cupo inicial registrado para este trabajo")

    batch: list[tuple[MaterialRequestLine | None, int | None, Decimal]] = []
    for line in lines:
        qty = Decimal(str(line.quantity_requested))
        if line.material_id and qty > 0:
            batch.append((line, line.material_id, qty))

    if not batch:
        raise ValueError("Indique al menos un material con cantidad")

    for _line, material_id, qty in batch:
        available = remaining.get(material_id, Decimal("0"))
        if material_id not in remaining:
            raise ValueError(f"El material #{material_id} no está en la mezcla principal")
        if qty > available + Decimal("0.0001"):
            raise ValueError(
                f"Cantidad {qty} kg supera lo restante ({available} kg) en la mezcla principal"
            )

    return principal


def _pending_warehouse_kg(db: Session, work_order_id: int) -> Decimal:
    """Kg solicitados a almacén pero aún no despachados (solicitudes adicionales)."""
    first_req = _first_material_request(db, work_order_id)
    if not first_req:
        return Decimal("0")

    total = Decimal("0")
    requests = (
        db.query(MaterialRequest)
        .options(joinedload(MaterialRequest.lines))
        .filter(
            MaterialRequest.work_order_id == work_order_id,
            MaterialRequest.id != first_req.id,
            MaterialRequest.status.in_(_OPEN_REQUEST_STATUSES),
        )
        .all()
    )
    for req in requests:
        for line in req.lines:
            pending = Decimal(str(line.quantity_requested)) - Decimal(
                str(line.quantity_dispatched or 0)
            )
            if pending > 0 and (line.unit or "kg").lower() == "kg":
                total += pending
    return total


def _extrusion_session_used_kg(session: ExtrusionRun) -> Decimal:
    produced = session.total_kg or Decimal("0")
    waste = Decimal("0")
    for segment in session.segments or []:
        for line in segment.waste_lines or []:
            waste += Decimal(str(line.waste_kg))
    for line in session.waste_lines or []:
        if getattr(line, "segment_id", None) is None:
            waste += Decimal(str(line.waste_kg))
    bolsones = Decimal(str(getattr(session, "bolsones_kg", None) or 0))
    core = Decimal(str(getattr(session, "core_kg", None) or 0))
    return produced + waste + bolsones + core


def _session_mixture_work_order_id(db: Session, session: ExtrusionRun) -> int | None:
    """Trabajo al que pertenece la mezcla consumida en la sesión de extrusión."""
    if session.mixture_production_run_id:
        mix_run = db.get(MixtureProductionRun, session.mixture_production_run_id)
        if mix_run:
            return mix_run.work_order_id
    if session.mixture_source_work_order_id:
        return session.mixture_source_work_order_id
    return session.work_order_id


def _resolve_session_mixture_row(db: Session, session: ExtrusionRun) -> tuple[str, str] | None:
    """SKU y nombre de la submezcla consumida en extrusión (incluye cruces)."""
    if session.mixture_production_run_id:
        mix_run = (
            db.query(MixtureProductionRun)
            .options(joinedload(MixtureProductionRun.mixture))
            .filter(MixtureProductionRun.id == session.mixture_production_run_id)
            .first()
        )
        if mix_run and mix_run.mixture:
            return mix_run.mixture.output_sku, mix_run.mixture.output_name

    source_wo_id = session.mixture_source_work_order_id
    if source_wo_id:
        sub = find_latest_submezcla(db, source_wo_id)
        if sub:
            return sub.output_sku, sub.output_name
        source_wo = session.mixture_source_work_order or db.get(WorkOrder, source_wo_id)
        code = source_wo.code if source_wo else str(source_wo_id)
        return f"CRUCE-{code}", f"Mezcla de {code} (cruce)"

    sub = find_latest_submezcla(db, session.work_order_id)
    if sub:
        return sub.output_sku, sub.output_name
    return None


def _cross_mixture_consumed_kg(db: Session, source_work_order_id: int) -> Decimal:
    """Kg de submezcla de este trabajo consumidos en extrusión atribuida a otra OP (cruce)."""
    from modules.extrusion_runs.service import production_work_order_id

    sessions = (
        db.query(ExtrusionRun)
        .options(
            joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
            joinedload(ExtrusionRun.waste_lines),
        )
        .filter(
            ExtrusionRun.status.in_(("completed", "in_progress")),
            or_(
                and_(
                    ExtrusionRun.mixture_source_work_order_id == source_work_order_id,
                    ExtrusionRun.work_order_id != source_work_order_id,
                ),
                and_(
                    ExtrusionRun.work_order_id == source_work_order_id,
                    ExtrusionRun.reassigned_work_order_id.isnot(None),
                    ExtrusionRun.reassigned_work_order_id != source_work_order_id,
                ),
            ),
        )
        .all()
    )
    used = Decimal("0")
    for session in sessions:
        mix_wo_id = _session_mixture_work_order_id(db, session)
        if mix_wo_id != source_work_order_id:
            continue
        if production_work_order_id(session) == source_work_order_id:
            continue
        used += _extrusion_session_used_kg(session)
    return used


def _submezcla_used_kg(db: Session, submezcla_id: int) -> Decimal:
    """Kg ya consumidos de la submezcla en extrusión (producido + desperdicio)."""
    used = Decimal("0")
    runs = (
        db.query(MixtureProductionRun)
        .filter(MixtureProductionRun.tinta_mixture_id == submezcla_id)
        .all()
    )
    for run in runs:
        sessions = (
            db.query(ExtrusionRun)
            .options(
                joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
                joinedload(ExtrusionRun.waste_lines),
            )
            .filter(ExtrusionRun.mixture_production_run_id == run.id)
            .all()
        )
        if sessions:
            for session in sessions:
                used += _extrusion_session_used_kg(session)
            continue
        if run.extrusion_run_id:
            session = (
                db.query(ExtrusionRun)
                .options(
                    joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
                    joinedload(ExtrusionRun.waste_lines),
                )
                .filter(ExtrusionRun.id == run.extrusion_run_id)
                .first()
            )
            if session:
                used += _extrusion_session_used_kg(session)
                continue
        if run.status == "completed" and run.produced_kg is not None:
            used += Decimal(str(run.produced_kg))
    return used


def _mixture_material_rows(components: list[TintaMixtureComponent]) -> list[dict]:
    rows: list[dict] = []
    for component in components:
        qty = Decimal(str(component.quantity))
        if qty <= 0:
            continue
        material = component.material
        rows.append(
            {
                "material_sku": material.sku if material else f"M-{component.material_id}",
                "material_name": material.name if material else f"Material #{component.material_id}",
                "total_kg": str(qty),
            }
        )
    return rows


def _submezcla_components_by_sku(
    db: Session,
    work_order_ids: list[int],
    output_sku: str,
) -> list[dict]:
    if not work_order_ids or not output_sku or output_sku.startswith("CRUCE-"):
        return []
    mixture = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components).joinedload(TintaMixtureComponent.material))
        .filter(
            TintaMixture.work_order_id.in_(work_order_ids),
            TintaMixture.output_sku == output_sku,
            TintaMixture.mixture_kind == "submezcla",
        )
        .order_by(TintaMixture.id.desc())
        .first()
    )
    if not mixture:
        return []
    return _mixture_material_rows(mixture.components)


def mixture_recipe_report_for_work_orders(db: Session, work_order_ids: list[int]) -> list[dict]:
    """Receta inicial de la mezcla principal por material (como en inventario/solicitudes)."""
    if not work_order_ids:
        return []

    totals: dict[int, tuple[str, str, Decimal]] = {}
    for work_order_id in work_order_ids:
        balance = get_principal_balance(db, work_order_id)
        if not balance:
            continue
        source_rows = balance.get("initial_components") or balance.get("components") or []
        for comp in source_rows:
            material_id = comp["material_id"]
            qty = Decimal(str(comp["quantity"]))
            if qty <= 0:
                continue
            material = comp.get("material") or {}
            sku = material.get("sku") or f"M-{material_id}"
            name = material.get("name") or sku
            if material_id in totals:
                totals[material_id] = (sku, name, totals[material_id][2] + qty)
            else:
                totals[material_id] = (sku, name, qty)

    return [
        {"material_sku": sku, "material_name": name, "total_kg": str(qty)}
        for sku, name, qty in sorted(totals.values(), key=lambda item: item[0])
    ]


def mixture_usage_report_for_work_orders(db: Session, work_order_ids: list[int]) -> dict:
    """Kg de mezcla consumidos en extrusión para reporte por orden (incluye cruces)."""
    if not work_order_ids:
        return {
            "total_mixture_used_kg": "0",
            "mixture_sent_cross_kg": "0",
            "mixture_received_cross_kg": "0",
            "mixture_totals": [],
        }

    from modules.extrusion_runs.service import extrusion_production_filter_many

    total_used = Decimal("0")
    cross_in = Decimal("0")
    sessions = (
        db.query(ExtrusionRun)
        .options(
            joinedload(ExtrusionRun.segments).joinedload(ExtrusionShiftSegment.waste_lines),
            joinedload(ExtrusionRun.waste_lines),
            joinedload(ExtrusionRun.mixture_source_work_order),
        )
        .filter(
            extrusion_production_filter_many(work_order_ids),
            ExtrusionRun.status.in_(("completed", "in_progress")),
        )
        .all()
    )
    sub_rows: dict[str, tuple[str, Decimal]] = {}
    for session in sessions:
        used = _extrusion_session_used_kg(session)
        if used <= 0:
            continue
        total_used += used
        mix_wo_id = _session_mixture_work_order_id(db, session)
        if mix_wo_id and mix_wo_id not in work_order_ids:
            cross_in += used

        resolved = _resolve_session_mixture_row(db, session)
        if not resolved:
            continue
        sku, name = resolved
        if sku in sub_rows:
            sub_rows[sku] = (name, sub_rows[sku][1] + used)
        else:
            sub_rows[sku] = (name, used)

    cross_sent = sum(
        (_cross_mixture_consumed_kg(db, wo_id) for wo_id in work_order_ids),
        Decimal("0"),
    )

    mixture_totals = [
        {
            "output_sku": sku,
            "output_name": name,
            "total_kg": str(qty),
            "components": _submezcla_components_by_sku(db, work_order_ids, sku),
        }
        for sku, (name, qty) in sorted(sub_rows.items(), key=lambda item: item[0])
    ]

    return {
        "total_mixture_used_kg": str(total_used),
        "mixture_sent_cross_kg": str(cross_sent),
        "mixture_received_cross_kg": str(cross_in),
        "mixture_totals": mixture_totals,
    }


def find_latest_submezcla(db: Session, work_order_id: int) -> TintaMixture | None:
    return (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.mixture_kind == "submezcla",
        )
        .order_by(TintaMixture.id.desc())
        .first()
    )


def get_submezcla_balance(db: Session, work_order_id: int) -> dict | None:
    subs = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.mixture_kind == "submezcla",
        )
        .order_by(TintaMixture.id.asc())
        .all()
    )
    if not subs:
        return None

    kg_dispatched = Decimal("0")
    kg_used = Decimal("0")
    for sub in subs:
        kg_dispatched += mixture_total_kg(sub.components)
        kg_used += _submezcla_used_kg(db, sub.id)

    cross_used = _cross_mixture_consumed_kg(db, work_order_id)
    kg_used += cross_used

    kg_available = max(Decimal("0"), kg_dispatched - kg_used)
    kg_pending = _pending_warehouse_kg(db, work_order_id)

    return {
        "submezcla_id": subs[-1].id,
        "kg_dispatched": str(kg_dispatched),
        "kg_used_in_extrusion": str(kg_used),
        "kg_used_cross_order": str(cross_used),
        "kg_available": str(kg_available),
        "kg_pending_warehouse": str(kg_pending),
        "kg_after_pending_dispatch": str(kg_available + kg_pending),
    }


def get_work_mixture_balance(db: Session, work_order_id: int) -> dict:
    recompute_principal_components(db, work_order_id)
    db.flush()
    return {
        "work_order_id": work_order_id,
        "principal": get_principal_balance(db, work_order_id),
        "submezcla": get_submezcla_balance(db, work_order_id),
    }


def refresh_extrusion_target_for_submezcla(db: Session, submezcla_id: int) -> None:
    """Tras sumar kg a la submezcla, actualiza el cupo de la sesión de extrusión activa."""
    mixture = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(TintaMixture.id == submezcla_id)
        .first()
    )
    if not mixture:
        return

    new_total = mixture_total_kg(mixture.components)
    run = (
        db.query(MixtureProductionRun)
        .filter(
            MixtureProductionRun.tinta_mixture_id == submezcla_id,
            MixtureProductionRun.status == "in_progress",
        )
        .order_by(MixtureProductionRun.id.desc())
        .first()
    )
    if not run or not run.extrusion_run_id:
        return

    session = db.get(ExtrusionRun, run.extrusion_run_id)
    if session and session.status == "in_progress":
        session.target_kg = new_total
        db.flush()


def get_principal_balance(db: Session, work_order_id: int) -> dict | None:
    recompute_principal_components(db, work_order_id)
    principal = find_principal_mezcla(db, work_order_id)
    if not principal:
        return None

    first_request = _first_material_request(db, work_order_id)
    kg_initial = (
        Decimal(str(first_request.kg_authorized))
        if first_request and first_request.kg_authorized
        else mixture_total_kg(principal.components)
    )
    kg_remaining = mixture_total_kg(principal.components)
    kg_dispatched = sum_submezcla_dispatched_kg(db, work_order_id, principal.id)

    initial_map = _initial_recipe_by_material(db, work_order_id)
    initial_components: list[dict] = []
    for material_id, qty in initial_map.items():
        if qty <= 0:
            continue
        from modules.materials.models import Material

        material = db.get(Material, material_id)
        initial_components.append(
            {
                "material_id": material_id,
                "quantity": str(qty),
                "material": {
                    "id": material.id,
                    "sku": material.sku,
                    "name": material.name,
                    "unit": material.unit,
                }
                if material
                else None,
            }
        )

    components = [
        {
            "material_id": c.material_id,
            "quantity": str(c.quantity),
            "material": {
                "id": c.material.id,
                "sku": c.material.sku,
                "name": c.material.name,
                "unit": c.material.unit,
            }
            if c.material
            else None,
        }
        for c in principal.components
        if Decimal(str(c.quantity)) > 0
    ]

    return {
        "principal_mixture_id": principal.id,
        "work_order_id": work_order_id,
        "kg_initial": str(kg_initial),
        "kg_remaining": str(kg_remaining),
        "kg_dispatched": str(kg_dispatched),
        "principal_exhausted": kg_remaining <= Decimal("0.001"),
        "components": components,
        "initial_components": initial_components,
    }


def sync_mezcla_from_material_request(db: Session, req: MaterialRequest) -> TintaMixture | None:
    """Mezcla principal = suma de MPs solicitadas (solo la primera solicitud del trabajo)."""
    if not req.work_order_id:
        return None

    existing_principal = find_principal_mezcla(db, req.work_order_id)
    if existing_principal:
        return existing_principal

    components = _components_from_request_lines(req.lines, quantity_attr="quantity_requested")
    if len(components) < 2:
        return None

    work = _load_work(db, req.work_order_id)
    if not work:
        return None

    mixture = TintaMixture(
        work_order_id=work.id,
        output_sku=work.code,
        output_name=_work_output_name(work),
        output_inventory_area="resina",
        output_tinta_subarea=None,
        unit="kg",
        mixture_kind="mezcla",
        material_request_id=req.id,
        notes=f"Mezcla principal — solicitud insumos #{req.id}",
        creator_name="Producción",
    )
    for component in components:
        mixture.components.append(component)
    db.add(mixture)
    db.flush()
    return mixture


def find_mergeable_submezcla(
    db: Session,
    *,
    parent_id: int | None,
    work_order_id: int,
) -> TintaMixture | None:
    base = (
        db.query(TintaMixture)
        .options(joinedload(TintaMixture.components))
        .filter(
            TintaMixture.work_order_id == work_order_id,
            TintaMixture.mixture_kind == "submezcla",
        )
    )
    if parent_id:
        linked = base.filter(TintaMixture.parent_mixture_id == parent_id).order_by(TintaMixture.id.desc()).first()
        if linked:
            return linked
    return base.order_by(TintaMixture.id.desc()).first()


def merge_dispatched_into_submezcla(
    submezcla: TintaMixture,
    dispatched_batch: list[tuple[MaterialRequestLine, Decimal]],
) -> None:
    comp_map = {c.material_id: c for c in submezcla.components}
    for line, qty in dispatched_batch:
        if not line.material_id or qty <= 0:
            continue
        existing = comp_map.get(line.material_id)
        if existing:
            existing.quantity = Decimal(str(existing.quantity)) + qty
        else:
            component = TintaMixtureComponent(
                material_id=line.material_id,
                quantity=qty,
            )
            submezcla.components.append(component)
            comp_map[line.material_id] = component


def create_submezcla_from_dispatch(
    db: Session,
    req: MaterialRequest,
    dispatched_batch: list[tuple[MaterialRequestLine, Decimal]],
    *,
    is_partial: bool,
) -> TintaMixture | None:
    """Submezcla = cantidades despachadas; se acumula en la submezcla existente si hay."""
    if not req.work_order_id:
        return None

    work = _load_work(db, req.work_order_id)
    if not work:
        return None

    components: list[TintaMixtureComponent] = []
    for line, qty in dispatched_batch:
        if line.material_id and qty > 0:
            components.append(
                TintaMixtureComponent(
                    material_id=line.material_id,
                    quantity=qty,
                )
            )

    if not components:
        return None

    parent = find_mezcla_for_request(db, req)
    partial_label = "parcial" if is_partial else "completo"

    existing_sub = find_mergeable_submezcla(
        db,
        parent_id=parent.id if parent else None,
        work_order_id=req.work_order_id,
    )
    if existing_sub:
        if parent and not existing_sub.parent_mixture_id:
            existing_sub.parent_mixture_id = parent.id
        merge_dispatched_into_submezcla(existing_sub, dispatched_batch)
        db.flush()
        refresh_extrusion_target_for_submezcla(db, existing_sub.id)
        return existing_sub

    mixture = TintaMixture(
        work_order_id=work.id,
        output_sku=work.code,
        output_name=_work_output_name(work),
        output_inventory_area="resina",
        output_tinta_subarea=None,
        unit="kg",
        mixture_kind="submezcla",
        parent_mixture_id=parent.id if parent else None,
        material_request_id=req.id,
        notes=f"Submezcla — despacho {partial_label} solicitud #{req.id}",
        creator_name="Almacén",
    )
    for component in components:
        mixture.components.append(component)
    db.add(mixture)
    db.flush()
    return mixture


def backfill_mixture_links(db: Session) -> None:
    """Corrige registros legacy: kind mezcla/submezcla y parent_mixture_id."""
    changed = False
    principals = (
        db.query(TintaMixture)
        .filter(TintaMixture.mixture_kind == "mezcla", TintaMixture.work_order_id.isnot(None))
        .all()
    )
    principal_by_work = {p.work_order_id: p for p in principals if p.work_order_id}

    orphans = (
        db.query(TintaMixture)
        .filter(
            TintaMixture.work_order_id.isnot(None),
            TintaMixture.mixture_kind.notin_(["mezcla", "submezcla"]),
            TintaMixture.material_request_id.isnot(None),
        )
        .order_by(TintaMixture.id.asc())
        .all()
    )
    for mixture in orphans:
        work_id = mixture.work_order_id
        if work_id not in principal_by_work:
            mixture.mixture_kind = "mezcla"
            principal_by_work[work_id] = mixture
        else:
            mixture.mixture_kind = "submezcla"
            if not mixture.parent_mixture_id:
                mixture.parent_mixture_id = principal_by_work[work_id].id
        changed = True

    subs = (
        db.query(TintaMixture)
        .filter(
            TintaMixture.mixture_kind == "submezcla",
            TintaMixture.parent_mixture_id.is_(None),
            TintaMixture.work_order_id.isnot(None),
        )
        .all()
    )
    for sub in subs:
        parent = principal_by_work.get(sub.work_order_id)
        if parent:
            sub.parent_mixture_id = parent.id
            changed = True

    if changed:
        db.flush()

    for work_id in principal_by_work:
        recompute_principal_components(db, work_id)
    if principal_by_work:
        db.flush()
