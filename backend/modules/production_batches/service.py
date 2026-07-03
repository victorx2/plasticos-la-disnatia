from datetime import date
from decimal import Decimal

from sqlalchemy.orm import Session

from modules.production.helpers import next_code, parse_date
from modules.production.models import Client, ClientOrder, ClientOrderLine, Product, ProductionBatch


def create_batch_with_order(
    db: Session,
    *,
    client_id: int,
    code: str | None,
    batch_notes: str | None,
    ordered_at: date | None,
    sale_for: str | None,
    order_notes: str | None,
    lines_data: list | None,
) -> ProductionBatch:
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Cliente no valido")

    existing_batch_codes = [row[0] for row in db.query(ProductionBatch.code).all()]
    batch_code = code or next_code("OP-", existing_batch_codes)
    if db.query(ProductionBatch).filter(ProductionBatch.code == batch_code).first():
        raise ValueError("Codigo de N OP ya existe")

    batch = ProductionBatch(code=batch_code, notes=batch_notes)
    db.add(batch)
    db.flush()

    order_code = _next_order_code_for_batch(db, batch)
    order = ClientOrder(
        batch_id=batch.id,
        client_id=client_id,
        code=order_code,
        status="open",
        notes=order_notes,
        ordered_at=ordered_at or date.today(),
        sale_for=sale_for,
    )
    if lines_data:
        _apply_lines(order, lines_data, db)
    db.add(order)
    db.flush()
    return batch


def add_order_to_batch(
    db: Session,
    batch: ProductionBatch,
    *,
    client_id: int,
    ordered_at: date | None,
    sale_for: str | None,
    notes: str | None,
    lines_data: list | None,
) -> ClientOrder:
    client = db.get(Client, client_id)
    if not client:
        raise ValueError("Cliente no valido")

    order_code = _next_order_code_for_batch(db, batch)
    order = ClientOrder(
        batch_id=batch.id,
        client_id=client_id,
        code=order_code,
        status="open",
        notes=notes,
        ordered_at=ordered_at or date.today(),
        sale_for=sale_for,
    )
    if lines_data:
        _apply_lines(order, lines_data, db)
    db.add(order)
    db.flush()
    return order


def ensure_batch_for_order(db: Session, order: ClientOrder, code: str) -> None:
    if order.batch_id:
        return
    batch = ProductionBatch(code=code, notes=order.notes)
    db.add(batch)
    db.flush()
    order.batch_id = batch.id


def _next_order_code_for_batch(db: Session, batch: ProductionBatch) -> str:
    existing = [row[0] for row in db.query(ClientOrder.code).filter(ClientOrder.batch_id == batch.id).all()]
    if not existing:
        return batch.code
    return next_code(f"{batch.code}-", existing)


def _apply_lines(order: ClientOrder, lines_data: list, db: Session) -> None:
    order.lines.clear()
    for item in lines_data:
        line = ClientOrderLine(
            product_id=item.product_id,
            material_id=item.material_id,
            quantity=Decimal(str(item.quantity)),
            unit=item.unit,
            description=item.description,
            notes=item.notes,
        )
        if item.product_id:
            line.product = db.get(Product, item.product_id)
        order.lines.append(line)
