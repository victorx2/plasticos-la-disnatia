"""Vacía todas las tablas excepto usuarios (y alembic_version para migraciones)."""
from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import inspect, text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Solo usuarios; alembic_version es metadato del esquema, no datos de negocio.
KEEP_TABLES = frozenset({
    "users",
    "alembic_version",
})


def main() -> None:
    from app.database import engine

    inspector = inspect(engine)
    tables = sorted(inspector.get_table_names())
    to_truncate = [t for t in tables if t not in KEEP_TABLES]

    if not to_truncate:
        print("No hay tablas para vaciar.")
        return

    print(f"Conservando: {', '.join(sorted(KEEP_TABLES))}")
    print(f"Vaciando {len(to_truncate)} tablas…")

    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        for table in to_truncate:
            conn.execute(text(f"TRUNCATE TABLE `{table}`"))
            print(f"  OK  {table}")
        conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))

    print("Listo.")


if __name__ == "__main__":
    main()
