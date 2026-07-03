from typing import Callable, TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")
R = TypeVar("R", bound=BaseModel)


def paginate(
    query: Query,
    page: int,
    per_page: int,
    mapper: Callable[[T], R],
) -> dict:
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    last_page = max(1, (total + per_page - 1) // per_page)
    from_ = (page - 1) * per_page + 1 if total > 0 else None
    to = min(page * per_page, total) if total > 0 else None
    return {
        "data": [mapper(item) for item in items],
        "total": total,
        "current_page": page,
        "per_page": per_page,
        "last_page": last_page,
        "from_": from_,
        "to": to,
    }
