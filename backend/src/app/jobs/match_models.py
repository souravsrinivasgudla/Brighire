"""Resume-job match database models."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResumeJobMatch(Base):
    """AI-generated match between a resume and a job."""

    __tablename__ = "resume_job_matches"

    __table_args__ = (
        UniqueConstraint(
            "resume_id",
            "job_id",
            name="uq_resume_job_match",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    resume_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey(
            "resumes.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    job_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey(
            "jobs.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    match_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    matched_skills: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    missing_skills: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    strengths: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    gaps: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    recommendations: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )