"""add photo_url to clients and vendors

Revision ID: 006_entity_photos
Revises: 005_suppliers_active
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006_entity_photos"
down_revision: Union[str, None] = "005_suppliers_active"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_photo_url(table: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns(table)}
    if "photo_url" not in columns:
        op.add_column(table, sa.Column("photo_url", sa.String(512), nullable=True))


def upgrade() -> None:
    _add_photo_url("clients")
    _add_photo_url("vendors")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table in ("clients", "vendors"):
        if table not in inspector.get_table_names():
            continue
        columns = {col["name"] for col in inspector.get_columns(table)}
        if "photo_url" in columns:
            op.drop_column(table, "photo_url")
