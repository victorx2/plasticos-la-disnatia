from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.avatars import delete_avatar_file, save_avatar
from app.database import get_db
from app.masters_validation import normalize_no_rif_payload, validate_contact, validate_rif
from modules.masters.clients.schemas import ClientCreate, ClientRead, ClientUpdate, PaginatedClients
from modules.production.models import Client, Vendor

router = APIRouter(tags=["clients"])


def _vendor_names_by_id(db: Session, vendor_ids: list[int]) -> dict[int, str]:
    if not vendor_ids:
        return {}
    rows = db.query(Vendor.id, Vendor.name).filter(Vendor.id.in_(vendor_ids)).all()
    return {int(vendor_id): name for vendor_id, name in rows}


def _client_read(client: Client, vendor_names: dict[int, str]) -> ClientRead:
    vendor_name = None
    if client.vendor_id:
        vendor_name = vendor_names.get(client.vendor_id)
    return ClientRead(
        id=client.id,
        name=client.name,
        active=client.active,
        rif=client.rif,
        state=client.state,
        city=client.city,
        address=client.address,
        email=client.email,
        phone=client.phone,
        vendor_id=client.vendor_id,
        vendor_name=vendor_name,
        photo_url=client.photo_url,
        created_at=client.created_at,
        updated_at=client.updated_at,
    )


def _validate_vendor(db: Session, vendor_id: int | None) -> None:
    if vendor_id is None:
        return
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"vendor_id": ["Vendedor no encontrado"]},
            },
        )
    if not vendor.active:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"vendor_id": ["El vendedor está inactivo"]},
            },
        )


@router.get("/clients", response_model=PaginatedClients)
def list_clients(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    active: int | None = Query(None, ge=0, le=1),
) -> PaginatedClients:
    query = db.query(Client)
    if active is not None:
        query = query.filter(Client.active.is_(bool(active)))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Client.name.ilike(term),
                Client.rif.ilike(term),
                Client.city.ilike(term),
                Client.state.ilike(term),
                Client.email.ilike(term),
                Client.phone.ilike(term),
            )
        )
    query = query.order_by(Client.id.desc())
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    vendor_names = _vendor_names_by_id(
        db,
        [client.vendor_id for client in items if client.vendor_id],
    )
    last_page = max(1, (total + per_page - 1) // per_page)
    from_ = (page - 1) * per_page + 1 if total > 0 else None
    to = min(page * per_page, total) if total > 0 else None
    return PaginatedClients(
        data=[_client_read(client, vendor_names) for client in items],
        total=total,
        current_page=page,
        per_page=per_page,
        last_page=last_page,
        from_=from_,
        to=to,
    )


@router.get("/clients/{client_id}", response_model=ClientRead)
def get_client(client_id: int, db: Annotated[Session, Depends(get_db)]) -> ClientRead:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    vendor_names = _vendor_names_by_id(db, [client.vendor_id] if client.vendor_id else [])
    return _client_read(client, vendor_names)


@router.post("/clients", response_model=ClientRead, status_code=201)
def create_client(payload: ClientCreate, db: Annotated[Session, Depends(get_db)]) -> ClientRead:
    data = normalize_no_rif_payload(payload.model_dump())
    _validate_vendor(db, data.get("vendor_id"))
    validate_rif(data.get("rif"))
    validate_contact(data.get("email"), data.get("phone"))
    client = Client(**data)
    db.add(client)
    db.commit()
    db.refresh(client)
    vendor_names = _vendor_names_by_id(db, [client.vendor_id] if client.vendor_id else [])
    return _client_read(client, vendor_names)


@router.patch("/clients/{client_id}", response_model=ClientRead)
def update_client(
    client_id: int,
    payload: ClientUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> ClientRead:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    data = normalize_no_rif_payload(payload.model_dump(exclude_unset=True))
    if "vendor_id" in data:
        _validate_vendor(db, data["vendor_id"])
    if "rif" in data:
        validate_rif(data["rif"])
    if "email" in data or "phone" in data:
        validate_contact(data.get("email"), data.get("phone"))
    for key, value in data.items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    vendor_names = _vendor_names_by_id(db, [client.vendor_id] if client.vendor_id else [])
    return _client_read(client, vendor_names)


@router.post("/clients/{client_id}/photo", response_model=ClientRead)
async def upload_client_photo(
    client_id: int,
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> ClientRead:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    client.photo_url = await save_avatar("clients", client_id, file, client.photo_url)
    db.commit()
    db.refresh(client)
    vendor_names = _vendor_names_by_id(db, [client.vendor_id] if client.vendor_id else [])
    return _client_read(client, vendor_names)


@router.delete("/clients/{client_id}/photo", response_model=ClientRead)
def delete_client_photo(client_id: int, db: Annotated[Session, Depends(get_db)]) -> ClientRead:
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    delete_avatar_file(client.photo_url)
    client.photo_url = None
    db.commit()
    db.refresh(client)
    vendor_names = _vendor_names_by_id(db, [client.vendor_id] if client.vendor_id else [])
    return _client_read(client, vendor_names)
