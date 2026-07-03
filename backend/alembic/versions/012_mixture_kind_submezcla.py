"""tinta_mixtures mixture_kind, parent_mixture_id, material_request_id

Revision ID: 012_mixture_kind_submezcla
Revises: 011_production_batches
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "012_mixture_kind_submezcla"
down_revision: Union[str, None] = "011_production_batches"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "tinta_mixtures" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("tinta_mixtures")}
    if "mixture_kind" not in cols:
        op.add_column(
            "tinta_mixtures",
            sa.Column("mixture_kind", sa.String(length=32), server_default="manual", nullable=False),
        )
        op.create_index("ix_tinta_mixtures_mixture_kind", "tinta_mixtures", ["mixture_kind"])
    if "parent_mixture_id" not in cols:
        op.add_column("tinta_mixtures", sa.Column("parent_mixture_id", sa.Integer(), nullable=True))
        op.create_index("ix_tinta_mixtures_parent_mixture_id", "tinta_mixtures", ["parent_mixture_id"])
        op.create_foreign_key(
            "fk_tinta_mixtures_parent_mixture_id",
            "tinta_mixtures",
            "tinta_mixtures",
            ["parent_mixture_id"],
            ["id"],
        )
    if "material_request_id" not in cols:
        op.add_column("tinta_mixtures", sa.Column("material_request_id", sa.Integer(), nullable=True))
        op.create_index("ix_tinta_mixtures_material_request_id", "tinta_mixtures", ["material_request_id"])
        op.create_foreign_key(
            "fk_tinta_mixtures_material_request_id",
            "tinta_mixtures",
            "material_requests",
            ["material_request_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "tinta_mixtures" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("tinta_mixtures")}
    if "material_request_id" in cols:
        op.drop_constraint("fk_tinta_mixtures_material_request_id", "tinta_mixtures", type_="foreignkey")
        op.drop_index("ix_tinta_mixtures_material_request_id", table_name="tinta_mixtures")
        op.drop_column("tinta_mixtures", "material_request_id")
    if "parent_mixture_id" in cols:
        op.drop_constraint("fk_tinta_mixtures_parent_mixture_id", "tinta_mixtures", type_="foreignkey")
        op.drop_index("ix_tinta_mixtures_parent_mixture_id", table_name="tinta_mixtures")
        op.drop_column("tinta_mixtures", "parent_mixture_id")
    if "mixture_kind" in cols:
        op.drop_index("ix_tinta_mixtures_mixture_kind", table_name="tinta_mixtures")
        op.drop_column("tinta_mixtures", "mixture_kind")
