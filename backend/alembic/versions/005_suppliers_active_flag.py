"""add active flag to suppliers

Revision ID: 005_suppliers_active
Revises: 004_po_change_reason
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005_suppliers_active"
down_revision: Union[str, None] = "004_po_change_reason"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "suppliers" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("suppliers")}
    if "active" not in columns:
        op.add_column(
            "suppliers",
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
        op.create_index("ix_suppliers_active", "suppliers", ["active"])
        op.execute("UPDATE suppliers SET active = 1 WHERE active IS NULL")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "suppliers" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("suppliers")}
    if "active" in columns:
        op.drop_index("ix_suppliers_active", table_name="suppliers")
        op.drop_column("suppliers", "active")
