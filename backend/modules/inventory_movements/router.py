from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.inventory_movements.schemas import (
    InventoryMovementMaterialBrief,
    InventoryMovementRead,
    PaginatedInventoryMovements,
)
from modules.materials.models import InventoryMovement, Material

router = APIRouter(tags=["inventory-movements"])

OUT_TYPES = {"dispatch", "adjustment_sub"}
IN_TYPES = {
    "purchase_receipt",
    "production_inbound",
    "inventory_return",
    "extrusion_waste",
    "excel_import",
    "adjustment_add",
}


def _api_movement_type(raw: str) -> str:
    if raw in OUT_TYPES or raw == "dispatch":
        return "out"
    if raw in IN_TYPES:
        return "in"
    if raw.startswith("adjustment"):
        return raw
    return "in" if raw.endswith("_in") else "out"


def _filter_types(api_type: str) -> set[str] | None:
    if api_type == "out":
        return OUT_TYPES | {"dispatch"}
    if api_type == "in":
        return IN_TYPES
    if api_type == "adjustment_add":
        return {"adjustment_add"}
    if api_type == "adjustment_sub":
        return {"adjustment_sub", "dispatch"}
    return None


def _to_read(row: InventoryMovement) -> InventoryMovementRead:
    material = row.material
    return InventoryMovementRead(
        id=row.id,
        material_id=row.material_id,
        movement_type=_api_movement_type(row.movement_type),
        quantity=str(row.quantity),
        reference_type=row.reference_type,
        reference_id=row.reference_id,
        occurred_at=row.occurred_at,
        reason=row.reason,
        material=InventoryMovementMaterialBrief(
            id=material.id,
            sku=material.sku,
            name=material.name,
            inventory_area=material.inventory_area,
            unit=material.unit,
        )
        if material
        else None,
    )


@router.get("/inventory-movements", response_model=PaginatedInventoryMovements)
def list_inventory_movements(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, alias="search"),
    q: str | None = None,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
    movement_type: str | None = None,
    inventory_area: str | None = None,
    reference_type: str | None = None,
) -> PaginatedInventoryMovements:
    term = (search or q or "").strip()
    query = db.query(InventoryMovement).options(joinedload(InventoryMovement.material))
    if from_:
        query = query.filter(InventoryMovement.occurred_at >= datetime.combine(from_, datetime.min.time()))
    if to:
        query = query.filter(InventoryMovement.occurred_at <= datetime.combine(to, datetime.max.time()))
    if movement_type:
        types = _filter_types(movement_type.strip().lower())
        if types:
            query = query.filter(InventoryMovement.movement_type.in_(types))
    if reference_type:
        query = query.filter(InventoryMovement.reference_type == reference_type.strip())
    if inventory_area or term:
        query = query.join(Material, InventoryMovement.material_id == Material.id)
        if inventory_area:
            query = query.filter(Material.inventory_area == inventory_area.strip())
        if term:
            like = f"%{term}%"
            query = query.filter((Material.sku.ilike(like)) | (Material.name.ilike(like)))
    query = query.order_by(InventoryMovement.occurred_at.desc(), InventoryMovement.id.desc())
    return PaginatedInventoryMovements(**paginate(query, page, per_page, _to_read))
