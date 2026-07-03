from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.orm import Session

from modules.materials.models import InventoryMovement, Material
from modules.production.helpers import parse_datetime
from modules.production.models import (
    PurchaseOrder,
    PurchaseOrderLine,
    PurchaseReceipt,
    PurchaseReceiptLine,
    Supplier,
)
from modules.purchase_receipts.schemas import PurchaseReceiptCreate


def _validation_error(errors: dict[str, list[str]], message: str = "Datos inválidos") -> HTTPException:
    return HTTPException(status_code=422, detail={"message": message, "errors": errors})


def recompute_po_status(order: PurchaseOrder) -> None:
    if not order.lines:
        order.status = "open"
        return
    total_received = sum((line.quantity_received or Decimal(0)) for line in order.lines)
    if total_received <= 0:
        order.status = "open"
        return
    all_complete = all(
        (line.quantity_received or Decimal(0)) >= (line.quantity_ordered or Decimal(0))
        for line in order.lines
        if (line.quantity_ordered or Decimal(0)) > 0
    )
    order.status = "completed" if all_complete else "partial"


def create_purchase_receipt(db: Session, payload: PurchaseReceiptCreate) -> PurchaseReceipt:
    errors: dict[str, list[str]] = {}

    if not payload.lines:
        errors["lines"] = ["Indique al menos una línea con cantidad"]

    order = db.get(PurchaseOrder, payload.purchase_order_id)
    if not order:
        errors["purchase_order_id"] = ["Orden de compra no encontrada"]
    elif not order.is_active:
        errors["purchase_order_id"] = ["La orden de compra no está activa"]

    supplier = db.get(Supplier, payload.supplier_id)
    if not supplier:
        errors["supplier_id"] = ["Proveedor no encontrado"]
    elif not supplier.active:
        errors["supplier_id"] = ["El proveedor está inactivo"]
    elif order and order.supplier_id != payload.supplier_id:
        errors["supplier_id"] = ["El proveedor no coincide con la orden de compra"]

    po_lines_by_id: dict[int, PurchaseOrderLine] = {}
    if order:
        po_lines_by_id = {line.id: line for line in order.lines}

    line_errors: dict[str, list[str]] = {}
    parsed_lines: list[tuple[PurchaseReceiptLineCreate, Decimal]] = []

    for idx, line in enumerate(payload.lines):
        qty = Decimal(str(line.quantity))
        if qty <= 0:
            line_errors[f"lines.{idx}.quantity"] = ["La cantidad debe ser mayor a cero"]
            continue

        po_line = po_lines_by_id.get(line.purchase_order_line_id)
        if not po_line:
            line_errors[f"lines.{idx}.purchase_order_line_id"] = ["Línea de orden no válida"]
            continue

        if po_line.material_id and po_line.material_id != line.material_id:
            line_errors[f"lines.{idx}.material_id"] = ["El material no coincide con la línea de la orden"]
            continue

        ordered = po_line.quantity_ordered or Decimal(0)
        received = po_line.quantity_received or Decimal(0)
        remaining = ordered - received
        if qty > remaining + Decimal("0.0001"):
            line_errors[f"lines.{idx}.quantity"] = ["La cantidad supera lo pendiente por recibir"]

        material = db.get(Material, line.material_id)
        if not material:
            line_errors[f"lines.{idx}.material_id"] = ["Material no encontrado"]
            continue

        parsed_lines.append((line, qty))

    if line_errors or errors:
        raise _validation_error({**errors, **line_errors})

    received_at = parse_datetime(payload.received_at)
    receipt = PurchaseReceipt(
        purchase_order_id=payload.purchase_order_id,
        without_purchase_order=payload.without_purchase_order,
        supplier_id=payload.supplier_id,
        supplier_name=(payload.supplier_name or supplier.name if supplier else None),
        invoice_number=payload.invoice_number,
        purchase_order_reference=payload.purchase_order_reference or (order.code if order else None),
        notes=payload.notes,
        received_at=received_at,
    )
    db.add(receipt)
    db.flush()

    for line_input, qty in parsed_lines:
        po_line = po_lines_by_id[line_input.purchase_order_line_id]
        po_line.quantity_received = (po_line.quantity_received or Decimal(0)) + qty

        micras = Decimal(str(line_input.micras)) if line_input.micras is not None else None
        ancho = Decimal(str(line_input.ancho_mm)) if line_input.ancho_mm is not None else None

        db.add(
            PurchaseReceiptLine(
                purchase_receipt_id=receipt.id,
                purchase_order_line_id=line_input.purchase_order_line_id,
                material_id=line_input.material_id,
                item_type=line_input.item_type,
                quantity=qty,
                unit=line_input.unit or "kg",
                micras=micras,
                ancho_mm=ancho,
            )
        )

        material = db.get(Material, line_input.material_id)
        if material:
            material.quantity_on_hand = (material.quantity_on_hand or Decimal(0)) + qty
            db.add(
                InventoryMovement(
                    material_id=material.id,
                    movement_type="purchase_receipt",
                    quantity=qty,
                    reference_type="purchase_receipt",
                    reference_id=receipt.id,
                    occurred_at=received_at,
                    reason=f"Recepción OC {order.code if order else receipt.id}",
                )
            )

    if order:
        recompute_po_status(order)

    db.commit()
    db.refresh(receipt)
    return receipt


def check_duplicate_receipts(
    db: Session,
    supplier_id: int,
    invoice_number: str | None,
    purchase_order_reference: str | None,
) -> list[PurchaseReceipt]:
    query = db.query(PurchaseReceipt).filter(PurchaseReceipt.supplier_id == supplier_id)
    if invoice_number and invoice_number.strip():
        query = query.filter(PurchaseReceipt.invoice_number == invoice_number.strip())
    if purchase_order_reference and purchase_order_reference.strip():
        query = query.filter(
            PurchaseReceipt.purchase_order_reference == purchase_order_reference.strip()
        )
    if not invoice_number and not purchase_order_reference:
        return []
    return query.order_by(PurchaseReceipt.id.desc()).limit(20).all()
