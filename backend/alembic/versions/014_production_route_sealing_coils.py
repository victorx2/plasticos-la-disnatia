"""work_orders.production_route + sealing_bobina_lines extrusion link

Revision ID: 014_production_route_sealing_coils
Revises: 013_extrusion_coil_segment_id
Create Date: 2026-06-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "014_production_route_sealing_coils"
down_revision: Union[str, None] = "013_extrusion_coil_segment_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "work_orders" in tables:
        cols = {c["name"] for c in inspector.get_columns("work_orders")}
        if "production_route" not in cols:
            op.add_column("work_orders", sa.Column("production_route", sa.String(32), nullable=True))
            op.create_index("ix_work_orders_production_route", "work_orders", ["production_route"])

    if "sealing_bobina_lines" in tables:
        cols = {c["name"] for c in inspector.get_columns("sealing_bobina_lines")}
        if "extrusion_coil_id" not in cols:
            op.add_column("sealing_bobina_lines", sa.Column("extrusion_coil_id", sa.Integer(), nullable=True))
            op.create_index(
                "ix_sealing_bobina_lines_extrusion_coil_id",
                "sealing_bobina_lines",
                ["extrusion_coil_id"],
            )
            op.create_foreign_key(
                "fk_sealing_bobina_lines_extrusion_coil_id",
                "sealing_bobina_lines",
                "extrusion_coils",
                ["extrusion_coil_id"],
                ["id"],
            )
        if "production_kg" not in cols:
            op.add_column(
                "sealing_bobina_lines",
                sa.Column("production_kg", sa.Numeric(14, 3), nullable=True),
            )
        if "waste_kg" not in cols:
            op.add_column(
                "sealing_bobina_lines",
                sa.Column("waste_kg", sa.Numeric(14, 3), server_default="0", nullable=False),
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "sealing_bobina_lines" in tables:
        cols = {c["name"] for c in inspector.get_columns("sealing_bobina_lines")}
        if "waste_kg" in cols:
            op.drop_column("sealing_bobina_lines", "waste_kg")
        if "production_kg" in cols:
            op.drop_column("sealing_bobina_lines", "production_kg")
        if "extrusion_coil_id" in cols:
            op.drop_constraint(
                "fk_sealing_bobina_lines_extrusion_coil_id",
                "sealing_bobina_lines",
                type_="foreignkey",
            )
            op.drop_index("ix_sealing_bobina_lines_extrusion_coil_id", table_name="sealing_bobina_lines")
            op.drop_column("sealing_bobina_lines", "extrusion_coil_id")

    if "work_orders" in tables:
        cols = {c["name"] for c in inspector.get_columns("work_orders")}
        if "production_route" in cols:
            op.drop_index("ix_work_orders_production_route", table_name="work_orders")
            op.drop_column("work_orders", "production_route")
