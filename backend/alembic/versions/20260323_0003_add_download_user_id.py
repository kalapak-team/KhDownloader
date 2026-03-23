"""add user ownership to downloads

Revision ID: 20260323_0003
Revises: 20260323_0002
Create Date: 2026-03-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260323_0003"
down_revision: Union[str, None] = "20260323_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("downloads", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index("idx_downloads_user_id", "downloads", ["user_id"])
    op.create_foreign_key(
        "fk_downloads_user_id_users",
        "downloads",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_downloads_user_id_users", "downloads", type_="foreignkey")
    op.drop_index("idx_downloads_user_id", table_name="downloads")
    op.drop_column("downloads", "user_id")
