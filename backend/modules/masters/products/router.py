from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.masters.products.schemas import PaginatedProducts, ProductCreate, ProductRead, ProductUpdate
from modules.production.models import Client, Product

router = APIRouter(tags=["products"])


def _validate_client(db: Session, client_id: int | None, *, required: bool = False) -> None:
    if client_id is None:
        if required:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Datos inválidos",
                    "errors": {"client_id": ["Seleccione un cliente."]},
                },
            )
        return
    client = db.get(Client, client_id)
    if not client:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"client_id": ["Cliente no encontrado"]},
            },
        )
    if not client.active:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Datos inválidos",
                "errors": {"client_id": ["El cliente está inactivo"]},
            },
        )


def _product_query(db: Session):
    return db.query(Product).options(joinedload(Product.client))


@router.get("/products", response_model=PaginatedProducts)
def list_products(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    q: str | None = None,
    client_id: int | None = None,
) -> PaginatedProducts:
    query = _product_query(db)
    if client_id is not None:
        query = query.filter(Product.client_id == client_id)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(term),
                Product.structure.ilike(term),
                Product.barcode.ilike(term),
            )
        )
    query = query.order_by(Product.id.desc())
    return PaginatedProducts(**paginate(query, page, per_page, ProductRead.model_validate))


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    product = _product_query(db).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Especificación no encontrada")
    return ProductRead.model_validate(product)


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    _validate_client(db, payload.client_id, required=True)
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    product = _product_query(db).filter(Product.id == product.id).first()
    return ProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> ProductRead:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Especificación no encontrada")
    data = payload.model_dump(exclude_unset=True)
    if "client_id" in data:
        _validate_client(db, data["client_id"], required=True)
    for key, value in data.items():
        setattr(product, key, value)
    db.commit()
    product = _product_query(db).filter(Product.id == product_id).first()
    return ProductRead.model_validate(product)
