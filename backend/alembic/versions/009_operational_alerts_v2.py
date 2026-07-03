"""align operational_alerts schema with MVP plan

Revision ID: 009_operational_alerts_v2
Revises: 008_operational_alerts
Create Date: 2026-06-20
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "009_operational_alerts_v2"
down_revision: Union[str, None] = "008_operational_alerts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "operational_alerts" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("operational_alerts")}

    if "dedupe_key" in columns and "alert_key" not in columns:
        op.alter_column(
            "operational_alerts",
            "dedupe_key",
            new_column_name="alert_key",
            existing_type=sa.String(length=128),
            existing_nullable=False,
        )
        columns.remove("dedupe_key")
        columns.add("alert_key")

    if "is_read" not in columns:
        op.add_column(
            "operational_alerts",
            sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        )
        if "read_at" in columns:
            op.execute(
                sa.text(
                    "UPDATE operational_alerts SET is_read = 1 WHERE read_at IS NOT NULL"
                )
            )

    if "read_by_user_id" not in columns:
        op.add_column("operational_alerts", sa.Column("read_by_user_id", sa.Integer(), nullable=True))
        op.create_foreign_key(
            "fk_operational_alerts_read_by_user_id",
            "operational_alerts",
            "users",
            ["read_by_user_id"],
            ["id"],
        )

    if "href_path" in columns:
        op.execute(
            sa.text(
                "UPDATE operational_alerts SET href_path = '/materiales' "
                "WHERE href_path IS NULL OR href_path = ''"
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "operational_alerts" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("operational_alerts")}
    if "read_by_user_id" in columns:
        op.drop_constraint("fk_operational_alerts_read_by_user_id", "operational_alerts", type_="foreignkey")
        op.drop_column("operational_alerts", "read_by_user_id")
    if "is_read" in columns:
        op.drop_column("operational_alerts", "is_read")
    if "alert_key" in columns:
        op.alter_column(
            "operational_alerts",
            "alert_key",
            new_column_name="dedupe_key",
            existing_type=sa.String(length=64),
            existing_nullable=False,
        )
