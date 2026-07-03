"""clients vendor FK and purchase receipts tables

Revision ID: 001_initial_pr
Revises:
Create Date: 2026-06-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "001_initial_pr"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "purchase_receipts" not in tables:
        op.create_table(
            "purchase_receipts",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("purchase_order_id", sa.Integer(), nullable=True),
            sa.Column("without_purchase_order", sa.Boolean(), nullable=False, server_default=sa.false()),
            sa.Column("supplier_id", sa.Integer(), nullable=False),
            sa.Column("supplier_name", sa.String(length=255), nullable=True),
            sa.Column("invoice_number", sa.String(length=128), nullable=True),
            sa.Column("purchase_order_reference", sa.String(length=64), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("received_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["purchase_order_id"], ["purchase_orders.id"]),
            sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_purchase_receipts_purchase_order_id", "purchase_receipts", ["purchase_order_id"])
        op.create_index("ix_purchase_receipts_supplier_id", "purchase_receipts", ["supplier_id"])
        op.create_index("ix_purchase_receipts_invoice_number", "purchase_receipts", ["invoice_number"])
        op.create_index("ix_purchase_receipts_received_at", "purchase_receipts", ["received_at"])

    if "purchase_receipt_lines" not in tables:
        op.create_table(
            "purchase_receipt_lines",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("purchase_receipt_id", sa.Integer(), nullable=False),
            sa.Column("purchase_order_line_id", sa.Integer(), nullable=True),
            sa.Column("material_id", sa.Integer(), nullable=False),
            sa.Column("item_type", sa.String(length=32), nullable=False),
            sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
            sa.Column("unit", sa.String(length=32), nullable=False, server_default="kg"),
            sa.Column("micras", sa.Numeric(14, 3), nullable=True),
            sa.Column("ancho_mm", sa.Numeric(14, 3), nullable=True),
            sa.ForeignKeyConstraint(["purchase_receipt_id"], ["purchase_receipts.id"]),
            sa.ForeignKeyConstraint(["purchase_order_line_id"], ["purchase_order_lines.id"]),
            sa.ForeignKeyConstraint(["material_id"], ["materials.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_purchase_receipt_lines_purchase_receipt_id",
            "purchase_receipt_lines",
            ["purchase_receipt_id"],
        )
        op.create_index(
            "ix_purchase_receipt_lines_purchase_order_line_id",
            "purchase_receipt_lines",
            ["purchase_order_line_id"],
        )
        op.create_index("ix_purchase_receipt_lines_material_id", "purchase_receipt_lines", ["material_id"])

    if "clients" in tables:
        op.execute(
            """
            UPDATE clients
            SET vendor_id = NULL
            WHERE vendor_id IS NOT NULL
              AND vendor_id NOT IN (SELECT id FROM vendors)
            """
        )
        fks = {fk["name"] for fk in inspector.get_foreign_keys("clients")}
        if "fk_clients_vendor_id_vendors" not in fks:
            op.create_foreign_key(
                "fk_clients_vendor_id_vendors",
                "clients",
                "vendors",
                ["vendor_id"],
                ["id"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "clients" in tables:
        fks = {fk["name"] for fk in inspector.get_foreign_keys("clients")}
        if "fk_clients_vendor_id_vendors" in fks:
            op.drop_constraint("fk_clients_vendor_id_vendors", "clients", type_="foreignkey")

    if "purchase_receipt_lines" in tables:
        op.drop_table("purchase_receipt_lines")
    if "purchase_receipts" in tables:
        op.drop_table("purchase_receipts")
