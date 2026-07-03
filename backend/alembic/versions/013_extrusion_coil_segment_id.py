"""extrusion_coils.segment_id for per-segment bobinas

Revision ID: 013_extrusion_coil_segment_id
Revises: 012_mixture_kind_submezcla
Create Date: 2026-06-22
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "013_extrusion_coil_segment_id"
down_revision: Union[str, None] = "012_mixture_kind_submezcla"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "extrusion_coils" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("extrusion_coils")}
    if "segment_id" not in cols:
        op.add_column("extrusion_coils", sa.Column("segment_id", sa.Integer(), nullable=True))
        op.create_index("ix_extrusion_coils_segment_id", "extrusion_coils", ["segment_id"])
        op.create_foreign_key(
            "fk_extrusion_coils_segment_id",
            "extrusion_coils",
            "extrusion_shift_segments",
            ["segment_id"],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "extrusion_coils" not in inspector.get_table_names():
        return

    cols = {c["name"] for c in inspector.get_columns("extrusion_coils")}
    if "segment_id" in cols:
        op.drop_constraint("fk_extrusion_coils_segment_id", "extrusion_coils", type_="foreignkey")
        op.drop_index("ix_extrusion_coils_segment_id", table_name="extrusion_coils")
        op.drop_column("extrusion_coils", "segment_id")
