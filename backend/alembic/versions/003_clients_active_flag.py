"""add active flag to clients

Revision ID: 003_clients_active
Revises: 002_users_po_seq
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_clients_active"
down_revision: Union[str, None] = "002_users_po_seq"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "clients" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("clients")}
    if "active" not in columns:
        op.add_column(
            "clients",
            sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        )
        op.create_index("ix_clients_active", "clients", ["active"])
        op.execute("UPDATE clients SET active = 1 WHERE active IS NULL")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "clients" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("clients")}
    if "active" in columns:
        op.drop_index("ix_clients_active", table_name="clients")
        op.drop_column("clients", "active")
