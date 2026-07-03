"""Crea la BD axones en MySQL, limpia datos mock e importa inventario del almacén."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pymysql
from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

os.environ.setdefault(
    "DATABASE_URL",
    "mysql+pymysql://root@127.0.0.1:3306/axones",
)

CSV_PATH = (
    ROOT.parent / "frontend" / "public" / "templates" / "inventario-inicial.csv"
)


def create_database() -> None:
    host = "127.0.0.1"
    user = "root"
    password = os.environ.get("MYSQL_PASSWORD", "")
    db_name = "axones"

    conn = pymysql.connect(host=host, user=user, password=password)
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
        print(f"Base de datos `{db_name}` lista.")
    finally:
        conn.close()


def reset_and_import() -> None:
  from app.database import SessionLocal, engine, init_db
  from modules.materials.import_service import import_materials_csv
  from modules.materials.models import ImportBatch, InventoryMovement, Material

  init_db()

  with engine.begin() as conn:
    conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
    conn.execute(text("TRUNCATE TABLE inventory_movements"))
    conn.execute(text("TRUNCATE TABLE materials"))
    conn.execute(text("TRUNCATE TABLE import_batches"))
    conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
  print("Tablas vaciadas (sin datos mock).")

  content = CSV_PATH.read_bytes()
  db = SessionLocal()
  try:
    result = import_materials_csv(db, "Inventario Almacen.csv", content)
    print(
      f"Importación: {result.created} creados, {result.updated} actualizados, "
      f"{result.skipped} omitidos."
    )
    if result.errors:
      for err in result.errors:
        print(f"  Fila {err.row}: {err.message}")
  finally:
    db.close()


if __name__ == "__main__":
  create_database()
  reset_and_import()
