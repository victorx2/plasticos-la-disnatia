from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.pagination import paginate
from modules.materials.models import Material
from modules.production.helpers import decimal_str
from modules.production.models import PurchaseReceipt, PurchaseReceiptLine, Supplier
from modules.purchase_receipts.schemas import (
    DuplicateReceiptCheck,
    DuplicateReceiptMatch,
    PaginatedPurchaseReceipts,
    PurchaseOrderBrief,
    PurchaseReceiptCreate,
    PurchaseReceiptLineRead,
    PurchaseReceiptRead,
    SupplierBrief,
)
from modules.purchase_receipts.service import check_duplicate_receipts, create_purchase_receipt

router = APIRouter(tags=["purchase-receipts"])


def _receipt_query(db: Session):
    return db.query(PurchaseReceipt).options(
        joinedload(PurchaseReceipt.supplier),
        joinedload(PurchaseReceipt.purchase_order),
        joinedload(PurchaseReceipt.lines).joinedload(PurchaseReceiptLine.material),
    )


def _line_read(line: PurchaseReceiptLine) -> PurchaseReceiptLineRead:
    return PurchaseReceiptLineRead(
        id=line.id,
        material_id=line.material_id,
        item_type=line.item_type,
        quantity=decimal_str(line.quantity) or "0",
        unit=line.unit,
        micras=decimal_str(line.micras),
        ancho_mm=decimal_str(line.ancho_mm),
        purchase_order_line_id=line.purchase_order_line_id,
        material={
            "id": line.material.id,
            "sku": line.material.sku,
            "name": line.material.name,
            "unit": line.material.unit,
        }
        if line.material
        else None,
    )


def _receipt_read(receipt: PurchaseReceipt, include_lines: bool = True) -> PurchaseReceiptRead:
    lines = [_line_read(line) for line in receipt.lines] if include_lines else []
    return PurchaseReceiptRead(
        id=receipt.id,
        purchase_order_id=receipt.purchase_order_id,
        without_purchase_order=receipt.without_purchase_order,
        supplier_id=receipt.supplier_id,
        supplier_name=receipt.supplier_name,
        invoice_number=receipt.invoice_number,
        purchase_order_reference=receipt.purchase_order_reference,
        notes=receipt.notes,
        received_at=receipt.received_at,
        lines_count=len(receipt.lines),
        lines=lines,
        supplier=SupplierBrief.model_validate(receipt.supplier) if receipt.supplier else None,
        purchase_order=(
            PurchaseOrderBrief.model_validate(receipt.purchase_order)
            if receipt.purchase_order
            else None
        ),
    )


def _load(db: Session, receipt_id: int) -> PurchaseReceipt:
    receipt = _receipt_query(db).filter(PurchaseReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Recepción no encontrada")
    return receipt


@router.get("/purchase-receipts", response_model=PaginatedPurchaseReceipts)
def list_purchase_receipts(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    purchase_order_id: int | None = None,
    supplier_name: str | None = None,
    invoice_number: str | None = None,
    material_term: str | None = None,
    from_: date | None = Query(None, alias="from"),
    to: date | None = None,
) -> PaginatedPurchaseReceipts:
    query = _receipt_query(db)
    if purchase_order_id is not None:
        query = query.filter(PurchaseReceipt.purchase_order_id == purchase_order_id)
    if supplier_name and supplier_name.strip():
        term = f"%{supplier_name.strip()}%"
        query = query.outerjoin(Supplier).filter(
            or_(Supplier.name.ilike(term), PurchaseReceipt.supplier_name.ilike(term))
        )
    if invoice_number and invoice_number.strip():
        query = query.filter(PurchaseReceipt.invoice_number.ilike(f"%{invoice_number.strip()}%"))
    if material_term and material_term.strip():
        term = f"%{material_term.strip()}%"
        query = (
            query.join(PurchaseReceipt.lines)
            .join(Material)
            .filter(or_(Material.sku.ilike(term), Material.name.ilike(term)))
            .distinct()
        )
    if from_ is not None:
        query = query.filter(func.date(PurchaseReceipt.received_at) >= from_)
    if to is not None:
        query = query.filter(func.date(PurchaseReceipt.received_at) <= to)
    query = query.order_by(PurchaseReceipt.id.desc())
    return PaginatedPurchaseReceipts(
        **paginate(query, page, per_page, lambda item: _receipt_read(item, include_lines=True))
    )


@router.get("/purchase-receipts/check-duplicates", response_model=DuplicateReceiptCheck)
def get_duplicate_receipts(
    db: Annotated[Session, Depends(get_db)],
    supplier_id: int = Query(..., ge=1),
    invoice_number: str | None = None,
    purchase_order_reference: str | None = None,
) -> DuplicateReceiptCheck:
    matches = check_duplicate_receipts(db, supplier_id, invoice_number, purchase_order_reference)
    serialized = [
        DuplicateReceiptMatch(
            id=item.id,
            supplier_id=item.supplier_id,
            supplier_name=item.supplier_name,
            invoice_number=item.invoice_number,
            purchase_order_reference=item.purchase_order_reference,
            received_at=item.received_at,
        )
        for item in matches
    ]
    return DuplicateReceiptCheck(
        has_duplicates=len(serialized) > 0,
        total_matches=len(serialized),
        matches=serialized,
    )


@router.get("/purchase-receipts/{receipt_id}", response_model=PurchaseReceiptRead)
def get_purchase_receipt(
    receipt_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> PurchaseReceiptRead:
    return _receipt_read(_load(db, receipt_id))


@router.post("/purchase-receipts", response_model=PurchaseReceiptRead, status_code=201)
def post_purchase_receipt(
    payload: PurchaseReceiptCreate,
    db: Annotated[Session, Depends(get_db)],
) -> PurchaseReceiptRead:
    receipt = create_purchase_receipt(db, payload)
    return _receipt_read(_load(db, receipt.id))
