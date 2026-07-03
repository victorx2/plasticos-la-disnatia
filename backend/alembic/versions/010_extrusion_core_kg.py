"""extrusion core_kg on segments and runs

Revision ID: 010_extrusion_core_kg
Revises: 009_operational_alerts_v2
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "010_extrusion_core_kg"
down_revision: Union[str, None] = "009_operational_alerts_v2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "extrusion_shift_segments" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("extrusion_shift_segments")}
        if "core_kg" not in cols:
            op.add_column(
                "extrusion_shift_segments",
                sa.Column("core_kg", sa.Numeric(14, 3), server_default="0", nullable=False),
            )

    if "extrusion_runs" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("extrusion_runs")}
        if "core_kg" not in cols:
            op.add_column(
                "extrusion_runs",
                sa.Column("core_kg", sa.Numeric(14, 3), server_default="0", nullable=False),
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "extrusion_shift_segments" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("extrusion_shift_segments")}
        if "core_kg" in cols:
            op.drop_column("extrusion_shift_segments", "core_kg")
    if "extrusion_runs" in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns("extrusion_runs")}
        if "core_kg" in cols:
            op.drop_column("extrusion_runs", "core_kg")
