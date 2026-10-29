"""add job portal source fields

Revision ID: f3a7c2d9e5b1
Revises: c8e4a91b7d12
Create Date: 2026-10-29 10:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3a7c2d9e5b1"
down_revision: Union[str, Sequence[str], None] = "c8e4a91b7d12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Track which portal a job was imported from."""

    op.add_column("jobs", sa.Column("source", sa.String(length=64), nullable=True))
    op.add_column("jobs", sa.Column("external_id", sa.String(length=255), nullable=True))
    op.add_column("jobs", sa.Column("url", sa.String(length=2048), nullable=True))

    # Manual jobs have NULL source/external_id; NULLs never collide in a
    # unique index, so only imported jobs are deduplicated.
    op.create_index(
        "uq_jobs_user_source_external_id",
        "jobs",
        ["user_id", "source", "external_id"],
        unique=True,
    )


def downgrade() -> None:
    """Remove job portal source fields."""

    op.drop_index("uq_jobs_user_source_external_id", table_name="jobs")
    op.drop_column("jobs", "url")
    op.drop_column("jobs", "external_id")
    op.drop_column("jobs", "source")
