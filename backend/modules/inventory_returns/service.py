from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from modules.dispatch.router import (
    _bolsones_dispatched_by_work_order,
    _bolsones_produced_by_work_order,
    _desperdicio_dispatched_by_work_order,
    _waste_produced_by_work_order,
)
from modules.extrusion_runs.service import extrusion_production_filter
from modules.production.models import ExtrusionCoil, ExtrusionRun, InventoryReturn, WorkOrder
from modules.tinta_mixtures.service import get_submezcla_balance


def _coil_shift(coil: ExtrusionCoil) -> str | None:
    if coil.dispatch_shift:
        return coil.dispatch_shift
    if coil.segment and coil.segment.shift:
        return coil.segment.shift
    if coil.extrusion_run and coil.extrusion_run.shift:
        return coil.extrusion_run.shift
    return None


def _returned_coil_ids(db: Session) -> set[int]:
    rows = (
        db.query(InventoryReturn.extrusion_coil_id)
        .filter(
            InventoryReturn.extrusion_coil_id.isnot(None),
            InventoryReturn.status.in_(["pending", "accepted"]),
        )
        .all()
    )
    return {coil_id for (coil_id,) in rows if coil_id}


def _work_order_measure(wo: WorkOrder | None) -> str | None:
    if not wo or not wo.product:
        return None
    structure = (wo.product.structure or "").strip()
    if structure:
        return structure
    name = (wo.product.name or "").strip()
    return name or None


def list_returnable_products(db: Session, work_order_id: int) -> list[dict]:
    wo = (
        db.query(WorkOrder)
        .options(joinedload(WorkOrder.product))
        .filter(WorkOrder.id == work_order_id)
        .first()
    )
    if not wo:
        return []

    measure = _work_order_measure(wo)
    product_name = wo.product.name if wo.product else None
    returned_ids = _returned_coil_ids(db)

    coils = (
        db.query(ExtrusionCoil)
        .join(ExtrusionRun, ExtrusionCoil.extrusion_run_id == ExtrusionRun.id)
        .options(
            joinedload(ExtrusionCoil.extrusion_run),
            joinedload(ExtrusionCoil.segment),
        )
        .filter(extrusion_production_filter(work_order_id))
        .order_by(ExtrusionCoil.id.asc())
        .all()
    )

    items: list[dict] = []
    for coil in coils:
        if coil.id in returned_ids:
            continue
        kg = Decimal(str(coil.kg or 0))
        code = coil.coil_code or f"BOB-{coil.id}"
        label = f"Bobina {code}"
        if measure:
            label = f"{label} · {measure}"
        shift = _coil_shift(coil)
        items.append(
            {
                "key": f"bobina:{coil.id}",
                "product_type": "bobina",
                "label": label,
                "extrusion_coil_id": coil.id,
                "extrusion_run_id": coil.extrusion_run_id,
                "shift": shift,
                "kg_per_unit": str(kg),
                "kg_available": str(kg if kg > 0 else Decimal("0")),
                "max_units": 1,
                "measure": measure,
                "product_name": product_name,
            }
        )

    bolsones_produced = _bolsones_produced_by_work_order(db).get(work_order_id, Decimal("0"))
    bolsones_dispatched = _bolsones_dispatched_by_work_order(db).get(work_order_id, Decimal("0"))
    bolsones_pending = bolsones_produced - bolsones_dispatched
    if bolsones_pending > 0:
        items.append(
            {
                "key": "bolsones",
                "product_type": "bolsones",
                "label": f"Bolsones{f' · {measure}' if measure else ''}",
                "extrusion_coil_id": None,
                "extrusion_run_id": None,
                "shift": None,
                "kg_per_unit": str(bolsones_pending),
                "kg_available": str(bolsones_pending),
                "max_units": 1,
                "measure": measure,
                "product_name": product_name,
            }
        )

    waste_bucket = _waste_produced_by_work_order(db).get(
        work_order_id,
        {"refil": Decimal("0"), "transparente": Decimal("0"), "total": Decimal("0")},
    )
    desperdicio_dispatched = _desperdicio_dispatched_by_work_order(db).get(work_order_id, Decimal("0"))
    desperdicio_pending = waste_bucket["total"] - desperdicio_dispatched
    if desperdicio_pending > 0:
        items.append(
            {
                "key": "desperdicio",
                "product_type": "desperdicio",
                "label": "Desperdicio",
                "extrusion_coil_id": None,
                "extrusion_run_id": None,
                "shift": None,
                "kg_per_unit": str(desperdicio_pending),
                "kg_available": str(desperdicio_pending),
                "max_units": 1,
                "measure": measure,
                "product_name": product_name,
            }
        )

    balance = get_submezcla_balance(db, work_order_id)
    if balance:
        available = Decimal(str(balance.get("kg_available") or 0))
        if available > 0:
            items.append(
                {
                    "key": "mezcla",
                    "product_type": "mezcla",
                    "label": f"Mezcla sobrante · {balance.get('output_name') or 'submezcla'}",
                    "extrusion_coil_id": None,
                    "extrusion_run_id": None,
                    "shift": None,
                    "kg_per_unit": str(available),
                    "kg_available": str(available),
                    "max_units": 1,
                    "measure": None,
                    "product_name": product_name,
                }
            )

    return items


DESTINATION_BY_PRODUCT: dict[str, str] = {
    "bobina": "bobinas_rechazadas",
    "bolsones": "miscelaneos",
    "desperdicio": "miscelaneos",
    "mezcla": "tintas",
}

DESTINATION_BY_ROUTE: dict[str, dict[str, str]] = {
    "fallas": {
        "bobina": "fallas",
        "bolsones": "fallas",
        "desperdicio": "fallas",
        "mezcla": "fallas",
    },
    "rejected": DESTINATION_BY_PRODUCT,
    "tintas": {
        "bobina": "bobinas_rechazadas",
        "bolsones": "miscelaneos",
        "desperdicio": "miscelaneos",
        "mezcla": "tintas",
    },
}


def resolve_return_line(
    db: Session,
    *,
    work_order_id: int,
    product_key: str,
    quantity_units: int,
    products: list[dict],
    return_route: str = "rejected",
) -> dict:
    product = next((item for item in products if item["key"] == product_key), None)
    if not product:
        raise ValueError("Producto no válido para esta orden")

    max_units = int(product.get("max_units") or 1)
    if quantity_units < 1 or quantity_units > max_units:
        raise ValueError(f"Cantidad debe ser entre 1 y {max_units}")

    kg_per = Decimal(str(product["kg_per_unit"]))
    total_kg = kg_per * quantity_units
    available = Decimal(str(product["kg_available"]))
    if product_type == "bobina" and total_kg <= 0:
        raise ValueError("La bobina no tiene peso registrado. Pese la bobina en despacho o extrusión.")
    if total_kg > available + Decimal("0.001"):
        raise ValueError(f"Solo hay {available} kg disponibles")

    product_type = product["product_type"]
    route_map = DESTINATION_BY_ROUTE.get(return_route, DESTINATION_BY_PRODUCT)
    return {
        "product_type": product_type,
        "destination_area": route_map.get(product_type, DESTINATION_BY_PRODUCT.get(product_type, "miscelaneos")),
        "quantity": total_kg,
        "quantity_units": quantity_units,
        "extrusion_coil_id": product.get("extrusion_coil_id"),
        "extrusion_run_id": product.get("extrusion_run_id"),
        "shift": product.get("shift"),
        "work_order_id": work_order_id,
    }
