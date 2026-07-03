"""add photo_url to suppliers

Revision ID: 007_suppliers_photo
Revises: 006_entity_photos
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "007_suppliers_photo"
down_revision: Union[str, None] = "006_entity_photos"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "suppliers" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("suppliers")}
    if "photo_url" not in columns:
        op.add_column("suppliers", sa.Column("photo_url", sa.String(512), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "suppliers" not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns("suppliers")}
    if "photo_url" in columns:
        op.drop_column("suppliers", "photo_url")
