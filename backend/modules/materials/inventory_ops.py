from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from modules.materials.models import InventoryMovement, Material
from modules.production.models import MaterialRequestLine

KG_PER_SACO = Decimal("25")


def sync_material_units_count(material: Material) -> None:
    """Mantiene sacos (25 kg) alineados con quantity_on_hand tras cada movimiento."""
    qty = material.quantity_on_hand or Decimal("0")
    if qty <= 0:
        material.units_count = Decimal("0")
        return
    material.units_count = (qty / KG_PER_SACO).quantize(Decimal("0.001"))


def resolve_line_material(
    db: Session,
    line: MaterialRequestLine,
    payload_material_id: int | None = None,
) -> Material | None:
    if payload_material_id:
        material = db.get(Material, payload_material_id)
        if material:
            line.material_id = material.id
            return material
    if line.material_id:
        return db.get(Material, line.material_id)
    description = (line.description or "").strip()
    if not description:
        return None
    if " · " in description:
        sku_part = description.split(" · ", 1)[0].strip()
        material = db.query(Material).filter(Material.sku == sku_part).first()
        if material:
            line.material_id = material.id
            return material
    like = f"%{description}%"
    material = (
        db.query(Material)
        .filter((Material.sku.ilike(like)) | (Material.name.ilike(like)))
        .order_by(Material.id.asc())
        .first()
    )
    if material:
        line.material_id = material.id
    return material


def subtract_stock(
    db: Session,
    material: Material,
    qty: Decimal,
    *,
    reference_type: str,
    reference_id: int,
    reason: str,
    allow_negative: bool = False,
) -> None:
    if qty <= 0:
        return
    if not allow_negative and (material.inventory_area or "").strip().lower() == "desperdicio":
        on_hand = material.quantity_on_hand or Decimal("0")
        if qty > on_hand:
            raise ValueError(
                f"Stock insuficiente en {material.sku}: hay {on_hand} kg, se solicitaron {qty} kg"
            )
    material.quantity_on_hand -= qty
    sync_material_units_count(material)
    db.add(
        InventoryMovement(
            material_id=material.id,
            movement_type="dispatch",
            quantity=qty,
            reference_type=reference_type,
            reference_id=reference_id,
            occurred_at=datetime.now(),
            reason=reason,
        )
    )


def add_stock(
    db: Session,
    material: Material,
    qty: Decimal,
    *,
    movement_type: str,
    reference_type: str,
    reference_id: int,
    reason: str,
) -> None:
    material.quantity_on_hand += qty
    sync_material_units_count(material)
    db.add(
        InventoryMovement(
            material_id=material.id,
            movement_type=movement_type,
            quantity=qty,
            reference_type=reference_type,
            reference_id=reference_id,
            occurred_at=datetime.now(),
            reason=reason,
        )
    )
