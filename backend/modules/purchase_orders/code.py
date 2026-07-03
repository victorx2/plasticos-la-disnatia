import re
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from modules.production.models import PurchaseOrder, PurchaseOrderCodeSequence

_CODE_RE = re.compile(r"^OC-(\d{4})-(\d+)$")


def _max_sequence_for_year(db: Session, year: int) -> int:
    row = db.get(PurchaseOrderCodeSequence, year)
    seq_last = row.last_number if row else 0

    max_from_orders = (
        db.query(func.max(PurchaseOrder.code))
        .filter(PurchaseOrder.code.like(f"OC-{year}-%"))
        .scalar()
    )
    order_last = 0
    if max_from_orders:
        match = _CODE_RE.match(str(max_from_orders))
        if match and int(match.group(1)) == year:
            order_last = int(match.group(2))

    return max(seq_last, order_last)


def peek_po_code(db: Session) -> str:
    """Vista previa del siguiente código sin reservarlo."""
    year = date.today().year
    return f"OC-{year}-{_max_sequence_for_year(db, year) + 1:03d}"


def allocate_po_code(db: Session) -> str:
    """Reserva atómicamente el siguiente código OC-{año}-{secuencia}."""
    year = date.today().year
    row = db.get(PurchaseOrderCodeSequence, year)
    if row is None:
        row = PurchaseOrderCodeSequence(year=year, last_number=_max_sequence_for_year(db, year))
        db.add(row)
        db.flush()

    row.last_number += 1
    return f"OC-{year}-{row.last_number:03d}"
