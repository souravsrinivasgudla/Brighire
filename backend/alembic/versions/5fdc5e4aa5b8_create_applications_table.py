"""create applications table

Revision ID: 5fdc5e4aa5b8
Revises: 4b6225ae6201
Create Date: 2026-08-26 07:34:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5fdc5e4aa5b8"
down_revision: str | Sequence[str] | None = "4b6225ae6201"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "applications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("job_id", sa.UUID(), nullable=False),
        sa.Column("resume_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(length=255), nullable=False),
        sa.Column("cover_letter", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["job_id"],
            ["jobs.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["resume_id"],
            ["resumes.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id",
            "job_id",
            name="uq_user_job_application",
        ),
    )

    op.create_index(
        op.f("ix_applications_user_id"),
        "applications",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_applications_job_id"),
        "applications",
        ["job_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_applications_resume_id"),
        "applications",
        ["resume_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_applications_resume_id"),
        table_name="applications",
    )
    op.drop_index(
        op.f("ix_applications_job_id"),
        table_name="applications",
    )
    op.drop_index(
        op.f("ix_applications_user_id"),
        table_name="applications",
    )
    op.drop_table("applications")
