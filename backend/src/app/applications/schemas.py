"""Application API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

APPLICATION_STATUSES = (
    "applied",
    "reviewing",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
)


class ApplicationCreate(BaseModel):
    """Schema for creating a job application."""

    job_id: UUID
    resume_id: UUID
    cover_letter: str | None = Field(
        default=None,
        max_length=10000,
    )


class ApplicationUpdate(BaseModel):
    """Schema for updating an application."""

    status: str = Field(
        min_length=1,
        max_length=50,
    )


class ApplicationResponse(BaseModel):
    """Schema returned for an application."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    job_id: UUID
    resume_id: UUID
    status: str
    cover_letter: str | None
    created_at: datetime
    updated_at: datetime