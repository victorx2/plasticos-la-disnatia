from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from modules.alerts.models import OperationalAlert  # noqa: F401
    from modules.materials import models  # noqa: F401
    from modules.production import models as production_models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_columns()
    _ensure_operational_alerts_schema()

    db = SessionLocal()
    try:
        from app.seed import seed_demo_data

        seed_demo_data(db)
        _ensure_production_batch_backfill(db)
        _ensure_mixture_links_backfill(db)
        from modules.dispatch.service import backfill_pallet_numbers

        backfill_pallet_numbers(db)
    finally:
        db.close()


def _ensure_mixture_links_backfill(db: Session) -> None:
    from modules.tinta_mixtures.service import backfill_mixture_links

    backfill_mixture_links(db)


def _ensure_production_batch_backfill(db: Session) -> None:
    from modules.production.models import ClientOrder, ProductionBatch

    if not db.query(ProductionBatch).first():
        orphan_orders = db.query(ClientOrder).filter(ClientOrder.batch_id.is_(None)).all()
        for order in orphan_orders:
            batch = ProductionBatch(code=order.code, notes=order.notes)
            db.add(batch)
            db.flush()
            order.batch_id = batch.id
        if orphan_orders:
            db.commit()


def _ensure_columns() -> None:
    """Añade columnas nuevas sin migraciones Alembic."""
    from sqlalchemy import inspect, text

    is_mysql = "mysql" in settings.database_url.lower()
    additions: list[tuple[str, str, str]] = [
        ("extrusion_runs", "bolsones_kg", "NUMERIC(14, 3) DEFAULT 0"),
        ("extrusion_runs", "reassigned_work_order_id", "INT NULL"),
        ("extrusion_runs", "total_effective_minutes", "NUMERIC(14, 2) DEFAULT 0"),
        ("extrusion_runs", "status", "VARCHAR(32) DEFAULT 'completed'"),
        ("extrusion_runs", "started_at", "DATETIME NULL"),
        ("extrusion_runs", "ended_at", "DATETIME NULL"),
        ("extrusion_runs", "effective_minutes", "NUMERIC(14, 2) NULL"),
        ("extrusion_runs", "production_format", "VARCHAR(64) NULL"),
        ("extrusion_runs", "target_kg", "NUMERIC(14, 3) NULL"),
        ("extrusion_runs", "recorded_date", "DATE NULL"),
        ("extrusion_runs", "mixture_production_run_id", "INT NULL"),
        ("extrusion_runs", "mixture_source_work_order_id", "INT NULL"),
        ("extrusion_shift_segments", "bolsones_kg", "NUMERIC(14, 3) DEFAULT 0"),
        ("extrusion_shift_segments", "core_kg", "NUMERIC(14, 3) DEFAULT 0"),
        ("extrusion_coils", "segment_id", "INT NULL"),
        ("extrusion_coils", "dispatch_shift", "VARCHAR(32) NULL"),
        ("extrusion_runs", "core_kg", "NUMERIC(14, 3) DEFAULT 0"),
        ("client_orders", "batch_id", "INT NULL"),
        ("work_orders", "client_order_line_id", "INT NULL"),
        ("clients", "active", "BOOLEAN DEFAULT 1"),
        ("purchase_orders", "change_reason", "TEXT"),
        ("suppliers", "active", "BOOLEAN DEFAULT 1"),
        ("clients", "photo_url", "VARCHAR(512)"),
        ("vendors", "photo_url", "VARCHAR(512)"),
        ("suppliers", "photo_url", "VARCHAR(512)"),
        ("tinta_mixtures", "mixture_kind", "VARCHAR(32) DEFAULT 'manual'"),
        ("tinta_mixtures", "parent_mixture_id", "INT NULL"),
        ("tinta_mixtures", "material_request_id", "INT NULL"),
        ("dispatch_pallets", "product_name", "VARCHAR(255) NULL"),
        ("dispatch_pallets", "measurements", "VARCHAR(128) NULL"),
        ("dispatch_pallets", "pallet_number", "INT NULL"),
        ("dispatch_pallets", "dispatch_batch_id", "VARCHAR(64) NULL"),
        ("material_requests", "is_replenishment", "BOOLEAN DEFAULT 0"),
        ("work_orders", "production_route", "VARCHAR(32) NULL"),
        ("sealing_bobina_lines", "extrusion_coil_id", "INT NULL"),
        ("sealing_bobina_lines", "production_kg", "NUMERIC(14, 3) NULL"),
        ("bolsones_manual_entries", "description", "VARCHAR(255) DEFAULT ''"),
        ("bolsones_manual_entries", "measure", "VARCHAR(128) NULL"),
        ("bolsones_dispatch_shipments", "measure", "VARCHAR(128) NULL"),
        ("bolsones_dispatch_releases", "measure", "VARCHAR(128) NULL"),
        ("bolsones_dispatch_shipments", "manual_entry_id", "INT NULL"),
        ("bolsones_dispatch_releases", "manual_entry_id", "INT NULL"),
        ("desperdicio_dispatch_shipments", "manual_entry_id", "INT NULL"),
        ("desperdicio_dispatch_releases", "manual_entry_id", "INT NULL"),
        ("desperdicio_manual_entries", "waste_type", "VARCHAR(32) NULL"),
        ("inventory_returns", "extrusion_coil_id", "INT NULL"),
        ("inventory_returns", "product_type", "VARCHAR(32) NULL"),
        ("inventory_returns", "shift", "VARCHAR(32) NULL"),
        ("inventory_returns", "quantity_units", "INT NULL"),
        ("extrusion_shift_segments", "fallas_kg", "NUMERIC(14, 3) DEFAULT 0"),
        ("extrusion_runs", "fallas_kg", "NUMERIC(14, 3) DEFAULT 0"),
    ]
    if is_mysql:
        additions.extend(
            [
                ("products", "client_id", "INT NULL"),
                ("products", "barcode", "VARCHAR(128) NULL"),
                ("products", "print_type", "VARCHAR(64) NULL"),
                ("products", "structure", "TEXT NULL"),
                ("products", "updated_at", "DATETIME NULL"),
            ]
        )
    else:
        additions.extend(
            [
                ("products", "client_id", "INTEGER"),
                ("products", "barcode", "VARCHAR(128)"),
                ("products", "print_type", "VARCHAR(64)"),
                ("products", "structure", "TEXT"),
                ("products", "updated_at", "DATETIME"),
            ]
        )

    inspector = inspect(engine)
    with engine.connect() as conn:
        for table, column, col_type in additions:
            if table not in inspector.get_table_names():
                continue
            existing = {col["name"] for col in inspector.get_columns(table)}
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
        conn.commit()


def _ensure_operational_alerts_schema() -> None:
    """Alinea operational_alerts con el esquema MVP (dev sin Alembic)."""
    from sqlalchemy import inspect, text

    is_mysql = "mysql" in settings.database_url.lower()
    inspector = inspect(engine)
    if "operational_alerts" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("operational_alerts")}
    with engine.connect() as conn:
        if "dedupe_key" in columns and "alert_key" not in columns:
            if is_mysql:
                conn.execute(
                    text(
                        "ALTER TABLE operational_alerts CHANGE dedupe_key alert_key "
                        "VARCHAR(64) NOT NULL"
                    )
                )
            else:
                conn.execute(text("ALTER TABLE operational_alerts RENAME COLUMN dedupe_key TO alert_key"))
            columns.remove("dedupe_key")
            columns.add("alert_key")

        if "is_read" not in columns:
            default = "0" if is_mysql else "FALSE"
            conn.execute(
                text(f"ALTER TABLE operational_alerts ADD COLUMN is_read BOOLEAN DEFAULT {default}")
            )
            if "read_at" in columns:
                conn.execute(
                    text("UPDATE operational_alerts SET is_read = 1 WHERE read_at IS NOT NULL")
                )
            columns.add("is_read")

        if "read_by_user_id" not in columns:
            conn.execute(text("ALTER TABLE operational_alerts ADD COLUMN read_by_user_id INT NULL"))
            columns.add("read_by_user_id")

        conn.commit()
