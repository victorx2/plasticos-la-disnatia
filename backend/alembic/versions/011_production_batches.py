"""production batches and client_order batch_id

Revision ID: 011_production_batches
Revises: 010_extrusion_core_kg
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "011_production_batches"
down_revision: Union[str, None] = "010_extrusion_core_kg"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "production_batches" not in tables:
        op.create_table(
            "production_batches",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("code", sa.String(length=64), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_production_batches_code", "production_batches", ["code"], unique=True)

    if "client_orders" in tables:
        cols = {c["name"] for c in inspector.get_columns("client_orders")}
        if "batch_id" not in cols:
            op.add_column("client_orders", sa.Column("batch_id", sa.Integer(), nullable=True))
            op.create_index("ix_client_orders_batch_id", "client_orders", ["batch_id"])
            op.create_foreign_key(
                "fk_client_orders_batch_id",
                "client_orders",
                "production_batches",
                ["batch_id"],
                ["id"],
            )

        conn = op.get_bind()
        orders = conn.execute(
            sa.text("SELECT id, code, notes FROM client_orders WHERE batch_id IS NULL")
        ).fetchall()
        for order_id, code, notes in orders:
            result = conn.execute(
                sa.text("INSERT INTO production_batches (code, notes) VALUES (:code, :notes)"),
                {"code": code, "notes": notes},
            )
            batch_id = result.lastrowid
            conn.execute(
                sa.text("UPDATE client_orders SET batch_id = :batch_id WHERE id = :order_id"),
                {"batch_id": batch_id, "order_id": order_id},
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "client_orders" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("client_orders")}
        if "batch_id" in cols:
            op.drop_constraint("fk_client_orders_batch_id", "client_orders", type_="foreignkey")
            op.drop_index("ix_client_orders_batch_id", table_name="client_orders")
            op.drop_column("client_orders", "batch_id")
    if "production_batches" in inspector.get_table_names():
        op.drop_index("ix_production_batches_code", table_name="production_batches")
        op.drop_table("production_batches")
