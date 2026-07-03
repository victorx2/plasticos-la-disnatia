from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from modules.production.models import DispatchPallet


def pallet_display_label(pallet: DispatchPallet) -> str:
    if pallet.pallet_number is not None and pallet.pallet_number > 0:
        return f"PALETA {pallet.pallet_number}"
    return pallet.code


def next_pallet_number_for_client(db: Session, client_name: str | None) -> int:
    if not client_name or not client_name.strip():
        max_num = db.query(func.max(DispatchPallet.pallet_number)).scalar()
        return int(max_num or 0) + 1
    matched = (
        db.query(func.max(DispatchPallet.pallet_number))
        .filter(func.lower(DispatchPallet.client_name) == client_name.strip().lower())
        .scalar()
    )
    return int(matched or 0) + 1


def new_dispatch_batch_id() -> str:
    return str(uuid.uuid4())


def backfill_pallet_numbers(db: Session) -> None:
    """Asigna pallet_number secuencial por cliente a registros legacy."""
    pallets = (
        db.query(DispatchPallet)
        .filter(DispatchPallet.pallet_number.is_(None))
        .order_by(DispatchPallet.created_at.asc(), DispatchPallet.id.asc())
        .all()
    )
    if not pallets:
        return
    counters: dict[str, int] = {}
    changed = False
    for pallet in pallets:
        key = (pallet.client_name or "").strip().lower() or "__sin_cliente__"
        counters[key] = counters.get(key, 0) + 1
        pallet.pallet_number = counters[key]
        changed = True
    if changed:
        db.commit()
