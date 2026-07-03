"""add change_reason to purchase_orders

Revision ID: 004_po_change_reason
Revises: 003_clients_active
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_po_change_reason"
down_revision: Union[str, None] = "003_clients_active"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "purchase_orders" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("purchase_orders")}
    if "change_reason" not in columns:
        op.add_column("purchase_orders", sa.Column("change_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "purchase_orders" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("purchase_orders")}
    if "change_reason" in columns:
        op.drop_column("purchase_orders", "change_reason")
