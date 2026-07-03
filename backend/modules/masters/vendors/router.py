from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
import re

from app.avatars import delete_avatar_file, save_avatar
from app.database import get_db
from app.pagination import paginate
from modules.masters.vendors.schemas import PaginatedVendors, VendorCreate, VendorRead, VendorUpdate
from modules.production.models import Client, Vendor

router = APIRouter(tags=["vendors"])

_PHONE_ERROR = "Teléfono inválido. Use solo números, espacios o guiones (7–15 dígitos)."


def _validate_phone_field(value: str | None, field: str, errors: dict[str, list[str]]) -> None:
    if value is None or not value.strip():
        return
    raw = value.strip()
    if not re.match(r"^[+]?[0-9\s\-()]+$", raw):
        errors[field] = [_PHONE_ERROR]
        return
    digits = len(re.findall(r"\d", raw))
    if digits < 7 or digits > 15:
        errors[field] = [_PHONE_ERROR]


def _validate_phones(phone_primary: str | None, phone_secondary: str | None) -> None:
    errors: dict[str, list[str]] = {}
    _validate_phone_field(phone_primary, "phone_primary", errors)
    _validate_phone_field(phone_secondary, "phone_secondary", errors)
    if errors:
        raise HTTPException(status_code=422, detail={"message": "Datos inválidos", "errors": errors})


def _client_counts_by_vendor(db: Session, vendor_ids: list[int]) -> dict[int, int]:
    if not vendor_ids:
        return {}
    rows = (
        db.query(Client.vendor_id, func.count(Client.id))
        .filter(Client.vendor_id.in_(vendor_ids))
        .group_by(Client.vendor_id)
        .all()
    )
    return {int(vendor_id): int(count) for vendor_id, count in rows if vendor_id is not None}


def _vendor_read(vendor: Vendor, clients_count: int = 0) -> VendorRead:
    return VendorRead(
        id=vendor.id,
        name=vendor.name,
        phone_primary=vendor.phone_primary,
        phone_secondary=vendor.phone_secondary,
        active=vendor.active,
        photo_url=vendor.photo_url,
        clients_count=clients_count,
        created_at=vendor.created_at,
        updated_at=vendor.updated_at,
    )


@router.get("/vendors", response_model=PaginatedVendors)
def list_vendors(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    active: int | None = Query(None, ge=0, le=1),
) -> PaginatedVendors:
    query = db.query(Vendor)
    if active is not None:
        query = query.filter(Vendor.active.is_(bool(active)))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Vendor.name.ilike(term),
                Vendor.phone_primary.ilike(term),
                Vendor.phone_secondary.ilike(term),
            )
        )
    query = query.order_by(Vendor.id.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    counts = _client_counts_by_vendor(db, [vendor.id for vendor in items])
    last_page = max(1, (total + per_page - 1) // per_page)
    from_ = (page - 1) * per_page + 1 if total > 0 else None
    to = min(page * per_page, total) if total > 0 else None
    return PaginatedVendors(
        data=[_vendor_read(vendor, counts.get(vendor.id, 0)) for vendor in items],
        total=total,
        current_page=page,
        per_page=per_page,
        last_page=last_page,
        from_=from_,
        to=to,
    )


@router.get("/vendors/{vendor_id}", response_model=VendorRead)
def get_vendor(vendor_id: int, db: Annotated[Session, Depends(get_db)]) -> VendorRead:
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    counts = _client_counts_by_vendor(db, [vendor.id])
    return _vendor_read(vendor, counts.get(vendor.id, 0))


@router.post("/vendors", response_model=VendorRead, status_code=201)
def create_vendor(payload: VendorCreate, db: Annotated[Session, Depends(get_db)]) -> VendorRead:
    _validate_phones(payload.phone_primary, payload.phone_secondary)
    vendor = Vendor(**payload.model_dump())
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return _vendor_read(vendor, 0)


@router.patch("/vendors/{vendor_id}", response_model=VendorRead)
def update_vendor(
    vendor_id: int,
    payload: VendorUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> VendorRead:
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    data = payload.model_dump(exclude_unset=True)
    if "phone_primary" in data or "phone_secondary" in data:
        _validate_phones(data.get("phone_primary"), data.get("phone_secondary"))
    for key, value in data.items():
        setattr(vendor, key, value)
    db.commit()
    db.refresh(vendor)
    counts = _client_counts_by_vendor(db, [vendor.id])
    return _vendor_read(vendor, counts.get(vendor.id, 0))


@router.post("/vendors/{vendor_id}/photo", response_model=VendorRead)
async def upload_vendor_photo(
    vendor_id: int,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> VendorRead:
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    vendor.photo_url = await save_avatar("vendors", vendor_id, file, vendor.photo_url)
    db.commit()
    db.refresh(vendor)
    counts = _client_counts_by_vendor(db, [vendor.id])
    return _vendor_read(vendor, counts.get(vendor.id, 0))


@router.delete("/vendors/{vendor_id}/photo", response_model=VendorRead)
def delete_vendor_photo(vendor_id: int, db: Annotated[Session, Depends(get_db)]) -> VendorRead:
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    delete_avatar_file(vendor.photo_url)
    vendor.photo_url = None
    db.commit()
    db.refresh(vendor)
    counts = _client_counts_by_vendor(db, [vendor.id])
    return _vendor_read(vendor, counts.get(vendor.id, 0))
