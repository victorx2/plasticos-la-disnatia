from decimal import Decimal

from sqlalchemy.orm import Session

from modules.materials.inventory_ops import add_stock, subtract_stock
from modules.materials.models import Material

WASTE_TYPES = ("refil", "transparente")


def waste_sku(waste_type: str) -> str:
    return f"DESP-{waste_type.upper()}"


def infer_waste_type(*texts: str | None) -> str | None:
    combined = " ".join((text or "").strip().lower() for text in texts if text and text.strip())
    if not combined:
        return None
    if "transparente" in combined:
        return "transparente"
    if "refil" in combined:
        return "refil"
    return None


def resolve_waste_type(
    waste_type: str | None,
    description: str | None = None,
    notes: str | None = None,
) -> str:
    normalized = (waste_type or "").strip().lower()
    if normalized in WASTE_TYPES:
        return normalized
    inferred = infer_waste_type(description, notes)
    if inferred:
        return inferred
    raise ValueError("Indique si el desperdicio es refil o transparente")


def get_or_create_desp_material(db: Session, waste_type: str) -> Material:
    if waste_type not in WASTE_TYPES:
        raise ValueError("Tipo de desperdicio debe ser refil o transparente")
    sku = waste_sku(waste_type)
    material = db.query(Material).filter(Material.sku == sku).first()
    if material:
        return material
    material = Material(
        sku=sku,
        name=f"Desperdicio extrusion ({waste_type})",
        inventory_area="desperdicio",
        unit="kg",
        quantity_on_hand=Decimal("0"),
    )
    db.add(material)
    db.flush()
    return material


def split_waste_kg(
    kg: Decimal,
    *,
    refil_kg: Decimal,
    transparente_kg: Decimal,
) -> list[tuple[str, Decimal]]:
    if kg <= 0:
        return []
    total = refil_kg + transparente_kg
    if total <= 0:
        return [("transparente", kg)]
    refil_part = (kg * refil_kg / total).quantize(Decimal("0.001"))
    trans_part = kg - refil_part
    parts: list[tuple[str, Decimal]] = []
    if refil_part > 0:
        parts.append(("refil", refil_part))
    if trans_part > 0:
        parts.append(("transparente", trans_part))
    return parts


def add_desp_stock(
    db: Session,
    waste_type: str,
    kg: Decimal,
    *,
    movement_type: str,
    reference_type: str,
    reference_id: int,
    reason: str,
) -> Material:
    if kg <= 0:
        raise ValueError("El peso debe ser mayor a cero")
    material = get_or_create_desp_material(db, waste_type)
    add_stock(
        db,
        material,
        kg,
        movement_type=movement_type,
        reference_type=reference_type,
        reference_id=reference_id,
        reason=reason,
    )
    return material


def subtract_desp_stock(
    db: Session,
    waste_type: str,
    kg: Decimal,
    *,
    reference_type: str,
    reference_id: int,
    reason: str,
    allow_negative: bool = False,
) -> Material:
    if kg <= 0:
        raise ValueError("El peso debe ser mayor a cero")
    material = get_or_create_desp_material(db, waste_type)
    if not allow_negative:
        on_hand = material.quantity_on_hand or Decimal("0")
        if kg > on_hand:
            raise ValueError(
                f"Stock insuficiente en {material.sku}: hay {on_hand} kg, se solicitaron {kg} kg"
            )
    subtract_stock(
        db,
        material,
        kg,
        reference_type=reference_type,
        reference_id=reference_id,
        reason=reason,
        allow_negative=allow_negative,
    )
    return material
