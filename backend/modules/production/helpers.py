from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ClientBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    rif: str | None = None
    address: str | None = None


class ProductBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    cpe: str | None = None
    mps: str | None = None


class MaterialBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    name: str
    unit: str | None = None


class WorkOrderBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str


class RequesterBrief(BaseModel):
    id: int = 1
    name: str = "Operador"


def decimal_str(value: Decimal | float | int | str | None) -> str | None:
    if value is None:
        return None
    return str(value)


def parse_date(value: str | date | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(value[:10])


def parse_datetime(value: str | datetime | None) -> datetime:
    if value is None:
        return datetime.now()
    if isinstance(value, datetime):
        return value
    text = value.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return datetime.fromisoformat(f"{text[:10]}T12:00:00")


def sum_kg_from_lines(lines: list, qty_attr: str = "quantity_requested", unit_attr: str = "unit") -> Decimal:
    total = Decimal("0")
    for line in lines:
        unit = (getattr(line, unit_attr, None) or "kg").lower()
        if unit != "kg":
            continue
        qty = getattr(line, qty_attr, None)
        if qty is None:
            continue
        total += Decimal(str(qty))
    return total


def next_code(prefix: str, existing: list[str]) -> str:
    nums = []
    for code in existing:
        if code.startswith(prefix):
            suffix = code[len(prefix) :]
            if suffix.isdigit():
                nums.append(int(suffix))
    n = max(nums, default=0) + 1
    return f"{prefix}{n:04d}"


def first_line_with_product(order) -> dict | None:
    for line in order.lines:
        if line.product_id and line.product:
            return {
                "id": line.id,
                "product_id": line.product_id,
                "quantity": str(line.quantity),
                "unit": line.unit,
                "product": {
                    "id": line.product.id,
                    "name": line.product.name,
                    "cpe": line.product.cpe,
                    "mps": line.product.mps,
                },
            }
    return None


def product_lines(order) -> list:
    return [line for line in order.lines if line.product_id]


def line_sequence(line, order) -> int:
    for idx, candidate in enumerate(product_lines(order), start=1):
        if candidate.id == line.id:
            return idx
    return 1


def pending_order_lines(open_orders: list, work_orders: list) -> list[tuple]:
    """Return (order, line, line_seq) tuples for lines without a scheduled work order."""
    scheduled_line_ids = {
        wo.client_order_line_id for wo in work_orders if wo.client_order_line_id is not None
    }
    legacy_first_line_covered: set[int] = set()
    for wo in work_orders:
        if wo.client_order_line_id is None:
            legacy_first_line_covered.add(wo.client_order_id)

    pending: list[tuple] = []
    for order in open_orders:
        for seq, line in enumerate(product_lines(order), start=1):
            if line.id in scheduled_line_ids:
                continue
            if order.id in legacy_first_line_covered and seq == 1:
                continue
            pending.append((order, line, seq))
    return pending
