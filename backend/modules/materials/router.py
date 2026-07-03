from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from modules.materials.import_service import import_materials_csv
from modules.materials.models import InventoryMovement, Material
from modules.materials.schemas import (
    ImportResult,
    MaterialCreate,
    MaterialRead,
    MaterialUpdate,
    PaginatedMaterials,
)

router = APIRouter(tags=["materials"])


def _to_read(material: Material) -> MaterialRead:
    return MaterialRead.model_validate(material)


@router.get("/materials", response_model=PaginatedMaterials)
def list_materials(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    inventory_area: str | None = None,
) -> PaginatedMaterials:
    query = db.query(Material)
    if inventory_area:
        query = query.filter(Material.inventory_area == inventory_area)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            (Material.name.ilike(term))
            | (Material.sku.ilike(term))
            | (Material.product_type.ilike(term))
            | (Material.brand.ilike(term))
            | (Material.inventory_area.ilike(term))
        )
    total = query.count()
    items = (
        query.order_by(Material.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    last_page = max(1, (total + per_page - 1) // per_page)
    from_ = (page - 1) * per_page + 1 if total > 0 else None
    to = min(page * per_page, total) if total > 0 else None
    return PaginatedMaterials(
        data=[_to_read(m) for m in items],
        total=total,
        current_page=page,
        per_page=per_page,
        last_page=last_page,
        from_=from_,
        to=to,
    )


@router.get("/materials/{material_id}", response_model=MaterialRead)
def get_material(material_id: int, db: Annotated[Session, Depends(get_db)]) -> MaterialRead:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return _to_read(material)


@router.post("/materials", response_model=MaterialRead, status_code=201)
def create_material(payload: MaterialCreate, db: Annotated[Session, Depends(get_db)]) -> MaterialRead:
    if db.query(Material).filter(Material.sku == payload.sku).first():
        raise HTTPException(status_code=409, detail="SKU ya existe")
    data = payload.model_dump(exclude={"supplier_id", "no_supplier_reason", "barcode"})
    if data.get("quantity_on_hand") is None:
        data["quantity_on_hand"] = Decimal("0")
    if data.get("min_stock") is None:
        data["min_stock"] = Decimal("0")
    material = Material(**data)
    db.add(material)
    db.flush()
    qty = material.quantity_on_hand or Decimal("0")
    if qty > 0:
        db.add(
            InventoryMovement(
                material_id=material.id,
                movement_type="manual_create",
                quantity=qty,
                reference_type="material",
                reference_id=material.id,
                occurred_at=datetime.now(timezone.utc),
                reason="Alta manual de material",
            )
        )
    db.commit()
    db.refresh(material)
    return _to_read(material)


@router.patch("/materials/{material_id}", response_model=MaterialRead)
def update_material(
    material_id: int,
    payload: MaterialUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> MaterialRead:
    material = db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(material, key, value)
    db.commit()
    db.refresh(material)
    return _to_read(material)


@router.post("/materials/import", response_model=ImportResult)
async def import_materials(
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> ImportResult:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Archivo requerido")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Archivo vacío")
    return import_materials_csv(db, file.filename, content)
