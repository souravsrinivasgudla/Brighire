"""Resume analysis database models."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ResumeAnalysis(Base):
    """AI-generated analysis for a resume."""

    __tablename__ = "resume_analyses"

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )

    resume_id: Mapped[UUID] = mapped_column(
        ForeignKey("resumes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    overall_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    summary: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    skills: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    strengths: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    weaknesses: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    missing_skills: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
    )

    suggestions: Mapped[list[str]] = mapped_column(
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