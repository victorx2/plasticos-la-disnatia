from datetime import datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.inventory_returns.schemas import (
    InventoryReturnAcceptInput,
    InventoryReturnBatchInput,
    InventoryReturnInput,
    InventoryReturnRead,
    PaginatedInventoryReturns,
    ReturnableProductRead,
)
from modules.inventory_returns.service import list_returnable_products, resolve_return_line
from modules.materials.models import InventoryMovement, Material
from modules.production.models import ExtrusionCoil, InventoryReturn, WorkOrder, FallasMaterialsShipment

router = APIRouter(tags=["inventory-returns"])

_WAREHOUSE_DESTINATIONS = frozenset({"bobinas_rechazadas", "tintas", "miscelaneos", "fallas"})
_MATERIALS_RELEASE_AREAS = frozenset({"fallas", "bobinas_rechazadas"})
_INVENTORY_RETURN_DEFAULT_REASON = "Devolución → materiales (reciclaje)"

_PRODUCT_LABELS = {
    "bobina": "Bobina",
    "bolsones": "Bolsones",
    "desperdicio": "Desperdicio",
    "mezcla": "Mezcla",
}


def _product_label(item: InventoryReturn) -> str | None:
    if item.extrusion_coil and item.extrusion_coil.coil_code:
        return f"Bobina {item.extrusion_coil.coil_code}"
    if item.product_type:
        return _PRODUCT_LABELS.get(item.product_type, item.product_type)
    if item.material:
        return f"{item.material.sku} · {item.material.name}"
    return None


def _sent_to_materials(db: Session, return_id: int) -> bool:
    row = (
        db.query(FallasMaterialsShipment.id)
        .filter(FallasMaterialsShipment.inventory_return_id == return_id)
        .first()
    )
    return row is not None


def _to_read(db: Session, item: InventoryReturn) -> InventoryReturnRead:
    wo = item.work_order
    work_order_payload = None
    if wo:
        work_order_payload = {
            "id": wo.id,
            "code": wo.code,
            "client_order_code": wo.client_order.code if wo.client_order else None,
        }
    return InventoryReturnRead(
        id=item.id,
        material_id=item.material_id,
        work_order_id=item.work_order_id,
        extrusion_run_id=item.extrusion_run_id,
        extrusion_coil_id=item.extrusion_coil_id,
        product_type=item.product_type,
        shift=item.shift,
        quantity_units=item.quantity_units,
        destination_area=item.destination_area,
        quantity=str(item.quantity),
        status=item.status,
        reason=item.reason,
        material={
            "id": item.material.id,
            "sku": item.material.sku,
            "name": item.material.name,
            "unit": item.material.unit,
        }
        if item.material
        else None,
        work_order=work_order_payload,
        product_label=_product_label(item),
        coil_code=item.extrusion_coil.coil_code if item.extrusion_coil else None,
        sent_to_materials=_sent_to_materials(db, item.id),
        created_at=item.created_at,
    )


def _load(db: Session, return_id: int) -> InventoryReturn:
    item = (
        db.query(InventoryReturn)
        .options(
            joinedload(InventoryReturn.material),
            joinedload(InventoryReturn.work_order).joinedload(WorkOrder.client_order),
            joinedload(InventoryReturn.extrusion_coil),
        )
        .filter(InventoryReturn.id == return_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Devolución no encontrada")
    return item


def _apply_materials_recycle(
    db: Session,
    *,
    shipment: FallasMaterialsShipment,
    reason: str | None,
) -> None:
    sku = "FALLAS-RECICLADO"
    material = db.query(Material).filter(Material.sku == sku).first()
    if not material:
        material = Material(
            sku=sku,
            name="Fallas recicladas (sustrato)",
            inventory_area="material",
            unit="kg",
            quantity_on_hand=Decimal("0"),
        )
        db.add(material)
        db.flush()
    material.quantity_on_hand += shipment.kg
    db.add(
        InventoryMovement(
            material_id=material.id,
            movement_type="inventory_return",
            quantity=shipment.kg,
            reference_type="fallas_materials_shipment",
            reference_id=shipment.id,
            occurred_at=datetime.now(),
            reason=reason or shipment.notes or f"Fallas a materiales #{shipment.id}",
        )
    )
    shipment.status = "accepted"


def _deduct_rejected_stock(db: Session, item: InventoryReturn, reason: str | None) -> None:
    sku = "BOB-RECHAZADA"
    material = db.query(Material).filter(Material.sku == sku).first()
    if not material:
        return
    qty = Decimal(str(item.quantity))
    if qty <= 0:
        return
    material.quantity_on_hand = max(Decimal("0"), material.quantity_on_hand - qty)
    db.add(
        InventoryMovement(
            material_id=material.id,
            movement_type="dispatch",
            quantity=qty,
            reference_type="inventory_return",
            reference_id=item.id,
            occurred_at=datetime.now(),
            reason=reason or item.reason or f"Salida bobina rechazada → materiales #{item.id}",
        )
    )


@router.get("/inventory-returns/returnable-products", response_model=list[ReturnableProductRead])
def returnable_products(
    db: Annotated[Session, Depends(get_db)],
    work_order_id: int = Query(..., ge=1),
) -> list[ReturnableProductRead]:
    wo = db.get(WorkOrder, work_order_id)
    if not wo:
        raise HTTPException(status_code=404, detail="Trabajo en planta no encontrado")
    return [ReturnableProductRead(**item) for item in list_returnable_products(db, work_order_id)]


@router.get("/inventory-returns", response_model=PaginatedInventoryReturns)
def list_inventory_returns(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: str | None = None,
    destination_area: str | None = None,
    destination_areas: str | None = None,
) -> PaginatedInventoryReturns:
    query = db.query(InventoryReturn).options(
        joinedload(InventoryReturn.material),
        joinedload(InventoryReturn.work_order).joinedload(WorkOrder.client_order),
        joinedload(InventoryReturn.extrusion_coil),
    )
    if status:
        query = query.filter(InventoryReturn.status == status)
    if destination_area:
        query = query.filter(InventoryReturn.destination_area == destination_area)
    if destination_areas:
        areas = [a.strip() for a in destination_areas.split(",") if a.strip()]
        if areas:
            query = query.filter(InventoryReturn.destination_area.in_(areas))
    query = query.order_by(InventoryReturn.id.desc())
    return PaginatedInventoryReturns(
        **paginate(query, page, per_page, lambda item: _to_read(db, item))
    )


def _validate_create_payload(payload: InventoryReturnInput) -> None:
    area = payload.destination_area.strip()
    if area == "bobinas_rechazadas" and not payload.work_order_id:
        raise HTTPException(
            status_code=422,
            detail={"message": "Datos inválidos", "errors": {"work_order_id": ["Requerido para bobinas malas"]}},
        )
    if area not in _WAREHOUSE_DESTINATIONS and not payload.material_id:
        raise HTTPException(
            status_code=422,
            detail={"message": "Datos inválidos", "errors": {"material_id": ["Requerido"]}},
        )


@router.post("/inventory-returns", response_model=InventoryReturnRead, status_code=201)
def create_inventory_return(
    payload: InventoryReturnInput,
    db: Annotated[Session, Depends(get_db)],
) -> InventoryReturnRead:
    area = payload.destination_area.strip()
    _validate_create_payload(payload)
    if payload.work_order_id:
        wo = db.get(WorkOrder, payload.work_order_id)
        if not wo:
            raise HTTPException(status_code=422, detail="Trabajo no válido")
    if payload.material_id:
        mat = db.get(Material, payload.material_id)
        if not mat:
            raise HTTPException(status_code=422, detail="Material no válido")
    qty = Decimal(str(payload.quantity))
    if qty <= 0:
        raise HTTPException(status_code=422, detail="Cantidad debe ser mayor a cero")
    item = InventoryReturn(
        material_id=payload.material_id,
        work_order_id=payload.work_order_id,
        extrusion_run_id=payload.extrusion_run_id,
        extrusion_coil_id=payload.extrusion_coil_id,
        product_type=payload.product_type,
        shift=payload.shift,
        quantity_units=payload.quantity_units,
        destination_area=area,
        quantity=qty,
        reason=payload.reason,
        status="pending",
    )
    db.add(item)
    db.commit()
    return _to_read(db, _load(db, item.id))


@router.post("/inventory-returns/batch", response_model=list[InventoryReturnRead], status_code=201)
def create_inventory_returns_batch(
    payload: InventoryReturnBatchInput,
    db: Annotated[Session, Depends(get_db)],
) -> list[InventoryReturnRead]:
    wo = db.get(WorkOrder, payload.work_order_id)
    if not wo:
        raise HTTPException(status_code=422, detail="Trabajo no válido")

    products = list_returnable_products(db, payload.work_order_id)
    if not products:
        raise HTTPException(status_code=422, detail="No hay productos disponibles para devolver en esta orden")

    used_keys: set[str] = set()
    created: list[InventoryReturn] = []
    for line in payload.lines:
        if line.product_key in used_keys and line.product_key.startswith("bobina:"):
            raise HTTPException(status_code=422, detail="No repita la misma bobina en la devolución")
        try:
            resolved = resolve_return_line(
                db,
                work_order_id=payload.work_order_id,
                product_key=line.product_key,
                quantity_units=line.quantity_units,
                products=products,
                return_route=payload.return_route,
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        used_keys.add(line.product_key)
        item = InventoryReturn(
            work_order_id=payload.work_order_id,
            extrusion_run_id=resolved.get("extrusion_run_id"),
            extrusion_coil_id=resolved.get("extrusion_coil_id"),
            product_type=resolved["product_type"],
            shift=resolved.get("shift"),
            quantity_units=resolved.get("quantity_units"),
            destination_area=resolved["destination_area"],
            quantity=resolved["quantity"],
            reason=payload.reason,
            status="pending",
        )
        db.add(item)
        created.append(item)

    db.commit()
    return [_to_read(db, _load(db, item.id)) for item in created]


@router.post("/inventory-returns/{return_id}/accept", response_model=InventoryReturnRead)
def accept_inventory_return(
    return_id: int,
    payload: InventoryReturnAcceptInput,
    db: Annotated[Session, Depends(get_db)],
) -> InventoryReturnRead:
    item = _load(db, return_id)
    if item.status != "pending":
        raise HTTPException(status_code=422, detail="La devolución ya fue procesada")
    if item.material_id:
        material = db.get(Material, item.material_id)
        if material:
            material.quantity_on_hand += item.quantity
            db.add(
                InventoryMovement(
                    material_id=material.id,
                    movement_type="inventory_return",
                    quantity=item.quantity,
                    reference_type="inventory_return",
                    reference_id=item.id,
                    occurred_at=datetime.now(),
                    reason=payload.reason or item.reason or f"Devolución #{item.id} aceptada",
                )
            )
    elif item.destination_area == "bobinas_rechazadas":
        sku = "BOB-RECHAZADA"
        material = db.query(Material).filter(Material.sku == sku).first()
        if not material:
            material = Material(
                sku=sku,
                name="Bobinas rechazadas (almacén)",
                inventory_area="bobinas_rechazadas",
                unit="kg",
                quantity_on_hand=Decimal("0"),
            )
            db.add(material)
            db.flush()
        material.quantity_on_hand += item.quantity
        db.add(
            InventoryMovement(
                material_id=material.id,
                movement_type="inventory_return",
                quantity=item.quantity,
                reference_type="inventory_return",
                reference_id=item.id,
                occurred_at=datetime.now(),
                reason=payload.reason or item.reason or f"Bobina mala WO #{item.work_order_id}",
            )
        )
    elif item.destination_area == "fallas":
        pass
    item.status = "accepted"
    if payload.reason:
        item.reason = payload.reason
    db.commit()
    return _to_read(db, _load(db, return_id))


@router.post("/inventory-returns/{return_id}/release-to-materials", response_model=InventoryReturnRead)
def release_inventory_return_to_materials(
    return_id: int,
    payload: InventoryReturnAcceptInput,
    db: Annotated[Session, Depends(get_db)],
) -> InventoryReturnRead:
    item = _load(db, return_id)
    if item.destination_area not in _MATERIALS_RELEASE_AREAS:
        raise HTTPException(
            status_code=422,
            detail="Solo devoluciones de fallas o bobinas rechazadas pueden ir a materiales",
        )
    if _sent_to_materials(db, item.id):
        raise HTTPException(status_code=422, detail="Esta devolución ya fue enviada a materiales")

    reason = payload.reason or item.reason or _INVENTORY_RETURN_DEFAULT_REASON
    if item.status == "accepted" and item.destination_area == "bobinas_rechazadas":
        _deduct_rejected_stock(db, item, reason)
    elif item.status == "pending":
        item.status = "accepted"
        if payload.reason:
            item.reason = payload.reason

    shipment = FallasMaterialsShipment(
        work_order_id=item.work_order_id,
        inventory_return_id=item.id,
        kg=item.quantity,
        notes=reason,
        status="pending",
    )
    db.add(shipment)
    db.flush()
    _apply_materials_recycle(db, shipment=shipment, reason=reason)
    db.commit()
    return _to_read(db, _load(db, return_id))
