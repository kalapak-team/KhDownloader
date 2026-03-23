"""create downloads table

Revision ID: 20260323_0001
Revises:
Create Date: 2026-03-23
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260323_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


format_type_enum = sa.Enum("audio", "video", name="format_type")
download_status_enum = sa.Enum("pending", "processing", "completed", "failed", name="download_status")


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    bind = op.get_bind()
    format_type_enum.create(bind, checkfirst=True)
    download_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "downloads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("thumbnail_url", sa.Text(), nullable=True),
        sa.Column("duration", sa.Integer(), nullable=True),
        sa.Column("format_type", format_type_enum, nullable=False),
        sa.Column("quality", sa.String(length=20), nullable=True),
        sa.Column("file_format", sa.String(length=10), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=True),
        sa.Column("file_path", sa.Text(), nullable=True),
        sa.Column("status", download_status_enum, nullable=False, server_default="pending"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("download_count", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("completed_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )

    op.create_index("idx_downloads_status", "downloads", ["status"])
    op.create_index("idx_downloads_created_at", "downloads", [sa.text("created_at DESC")])
    op.create_index("idx_downloads_ip", "downloads", ["ip_address"])


def downgrade() -> None:
    op.drop_index("idx_downloads_ip", table_name="downloads")
    op.drop_index("idx_downloads_created_at", table_name="downloads")
    op.drop_index("idx_downloads_status", table_name="downloads")
    op.drop_table("downloads")

    bind = op.get_bind()
    download_status_enum.drop(bind, checkfirst=True)
    format_type_enum.drop(bind, checkfirst=True)
