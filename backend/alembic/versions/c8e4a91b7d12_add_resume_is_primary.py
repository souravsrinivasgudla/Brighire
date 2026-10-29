"""add resume is_primary

Revision ID: c8e4a91b7d12
Revises: 5fdc5e4aa5b8
Create Date: 2026-09-21 05:05:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c8e4a91b7d12"
down_revision: Union[str, Sequence[str], None] = "5fdc5e4aa5b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add is_primary and backfill one primary resume per user."""

    op.add_column(
        "resumes",
        sa.Column(
            "is_primary",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.execute(
        """
        UPDATE resumes AS r
        SET is_primary = TRUE
        WHERE r.id IN (
            SELECT DISTINCT ON (user_id) id
            FROM resumes
            ORDER BY user_id, created_at DESC, id DESC
        )
        """
    )

    op.create_index(
        "uq_resumes_one_primary_per_user",
        "resumes",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_primary IS TRUE"),
    )


def downgrade() -> None:
    """Remove is_primary."""

    op.drop_index(
        "uq_resumes_one_primary_per_user",
        table_name="resumes",
        postgresql_where=sa.text("is_primary IS TRUE"),
    )
    op.drop_column("resumes", "is_primary")
