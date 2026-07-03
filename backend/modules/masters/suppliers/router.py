from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.avatars import delete_avatar_file, save_avatar
from app.database import get_db
from app.masters_validation import normalize_no_rif_payload, validate_contact, validate_rif
from app.pagination import paginate
from modules.masters.suppliers.schemas import PaginatedSuppliers, SupplierCreate, SupplierRead, SupplierUpdate
from modules.production.models import Supplier

router = APIRouter(tags=["suppliers"])


def _normalize_supplier_payload(data: dict) -> dict:
    return normalize_no_rif_payload(data)


@router.get("/suppliers", response_model=PaginatedSuppliers)
def list_suppliers(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    active: int | None = Query(None, ge=0, le=1),
) -> PaginatedSuppliers:
    query = db.query(Supplier)
    if active is not None:
        query = query.filter(Supplier.active.is_(bool(active)))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Supplier.name.ilike(term),
                Supplier.rif.ilike(term),
                Supplier.email.ilike(term),
                Supplier.phone.ilike(term),
            )
        )
    query = query.order_by(Supplier.id.desc())
    return PaginatedSuppliers(**paginate(query, page, per_page, SupplierRead.model_validate))


@router.get("/suppliers/{supplier_id}", response_model=SupplierRead)
def get_supplier(supplier_id: int, db: Annotated[Session, Depends(get_db)]) -> SupplierRead:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return SupplierRead.model_validate(supplier)


@router.post("/suppliers", response_model=SupplierRead, status_code=201)
def create_supplier(payload: SupplierCreate, db: Annotated[Session, Depends(get_db)]) -> SupplierRead:
    data = _normalize_supplier_payload(payload.model_dump())
    validate_rif(data.get("rif"))
    validate_contact(data.get("email"), data.get("phone"))
    supplier = Supplier(**data)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return SupplierRead.model_validate(supplier)


@router.patch("/suppliers/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: int,
    payload: SupplierUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> SupplierRead:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    data = _normalize_supplier_payload(payload.model_dump(exclude_unset=True))
    if "rif" in data:
        validate_rif(data.get("rif"))
    if "email" in data or "phone" in data:
        validate_contact(data.get("email"), data.get("phone"))
    for key, value in data.items():
        setattr(supplier, key, value)
    db.commit()
    db.refresh(supplier)
    return SupplierRead.model_validate(supplier)


@router.post("/suppliers/{supplier_id}/photo", response_model=SupplierRead)
async def upload_supplier_photo(
    supplier_id: int,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> SupplierRead:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    supplier.photo_url = await save_avatar("suppliers", supplier_id, file, supplier.photo_url)
    db.commit()
    db.refresh(supplier)
    return SupplierRead.model_validate(supplier)


@router.delete("/suppliers/{supplier_id}/photo", response_model=SupplierRead)
def delete_supplier_photo(
    supplier_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> SupplierRead:
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    delete_avatar_file(supplier.photo_url)
    supplier.photo_url = None
    db.commit()
    db.refresh(supplier)
    return SupplierRead.model_validate(supplier)
