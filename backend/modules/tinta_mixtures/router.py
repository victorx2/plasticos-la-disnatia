from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.production.models import TintaMixture, TintaMixtureComponent, WorkOrder
from modules.tinta_mixtures.schemas import (
    PaginatedTintaMixtures,
    PrincipalBalanceRead,
    SubmezclaBalanceRead,
    TintaMixtureComponentRead,
    TintaMixtureInput,
    TintaMixtureRead,
    WorkMixtureBalanceRead,
)
from modules.tinta_mixtures.service import get_principal_balance, get_work_mixture_balance

router = APIRouter(tags=["tinta-mixtures"])


def _to_read(mixture: TintaMixture) -> TintaMixtureRead:
    return TintaMixtureRead(
        id=mixture.id,
        output_sku=mixture.output_sku,
        output_name=mixture.output_name,
        output_inventory_area=mixture.output_inventory_area,
        output_tinta_subarea=mixture.output_tinta_subarea,
        unit=mixture.unit,
        notes=mixture.notes,
        work_order_id=mixture.work_order_id,
        work_order={"id": mixture.work_order.id, "code": mixture.work_order.code}
        if mixture.work_order
        else None,
        components_count=len(mixture.components),
        components=[
            TintaMixtureComponentRead(
                id=c.id,
                material_id=c.material_id,
                quantity=str(c.quantity),
                material={"id": c.material.id, "sku": c.material.sku, "name": c.material.name, "unit": c.material.unit}
                if c.material
                else None,
            )
            for c in mixture.components
        ],
        creator={"id": 1, "name": mixture.creator_name or "Operador"},
        created_at=mixture.created_at,
        mixture_kind=getattr(mixture, "mixture_kind", None) or "manual",
        parent_mixture_id=getattr(mixture, "parent_mixture_id", None),
        material_request_id=getattr(mixture, "material_request_id", None),
    )


@router.get("/tinta-mixtures", response_model=PaginatedTintaMixtures)
def list_tinta_mixtures(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=500),
    q: str | None = None,
    work_order_id: int | None = None,
    mixture_kind: str | None = None,
) -> PaginatedTintaMixtures:
    query = db.query(TintaMixture).options(
        joinedload(TintaMixture.work_order),
        joinedload(TintaMixture.components).joinedload(TintaMixtureComponent.material),
    )
    if work_order_id:
        query = query.filter(TintaMixture.work_order_id == work_order_id)
    if mixture_kind:
        query = query.filter(TintaMixture.mixture_kind == mixture_kind.strip())
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(
            TintaMixture.output_sku.ilike(term) | TintaMixture.output_name.ilike(term)
        )
    query = query.order_by(TintaMixture.id.desc())
    return PaginatedTintaMixtures(**paginate(query, page, per_page, _to_read))


@router.get("/tinta-mixtures/principal-balance/{work_order_id}", response_model=PrincipalBalanceRead)
def read_principal_balance(
    work_order_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> PrincipalBalanceRead:
    balance = get_principal_balance(db, work_order_id)
    if not balance:
        raise HTTPException(status_code=404, detail="Sin mezcla principal para este trabajo")
    return PrincipalBalanceRead.model_validate(balance)


@router.get("/tinta-mixtures/work-balance/{work_order_id}", response_model=WorkMixtureBalanceRead)
def read_work_mixture_balance(
    work_order_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> WorkMixtureBalanceRead:
    balance = get_work_mixture_balance(db, work_order_id)
    principal = balance.get("principal")
    submezcla = balance.get("submezcla")
    if not principal and not submezcla:
        raise HTTPException(status_code=404, detail="Sin mezcla registrada para este trabajo")
    return WorkMixtureBalanceRead(
        work_order_id=work_order_id,
        principal=PrincipalBalanceRead.model_validate(principal) if principal else None,
        submezcla=SubmezclaBalanceRead.model_validate(submezcla) if submezcla else None,
    )


@router.post("/tinta-mixtures", response_model=TintaMixtureRead, status_code=201)
def create_tinta_mixture(
    payload: TintaMixtureInput,
    db: Annotated[Session, Depends(get_db)],
) -> TintaMixtureRead:
    if payload.work_order_id:
        wo = db.get(WorkOrder, payload.work_order_id)
        if not wo:
            raise HTTPException(status_code=422, detail="Trabajo en planta no válido")
    mixture = TintaMixture(
        work_order_id=payload.work_order_id,
        output_sku=payload.output_sku,
        output_name=payload.output_name,
        output_inventory_area=payload.output_inventory_area,
        output_tinta_subarea=payload.output_tinta_subarea,
        unit=payload.unit,
        notes=payload.notes,
        creator_name="Operador",
        mixture_kind="manual",
    )
    for comp in payload.components:
        mixture.components.append(
            TintaMixtureComponent(
                material_id=comp.material_id,
                quantity=Decimal(str(comp.quantity)),
            )
        )
    db.add(mixture)
    db.commit()
    mixture = (
        db.query(TintaMixture)
        .options(
            joinedload(TintaMixture.work_order),
            joinedload(TintaMixture.components).joinedload(TintaMixtureComponent.material),
        )
        .filter(TintaMixture.id == mixture.id)
        .first()
    )
    return _to_read(mixture)
