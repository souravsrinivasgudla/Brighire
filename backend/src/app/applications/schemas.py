"""Application API schemas."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ApplicationStatus(str, Enum):
    """Allowed job application statuses."""

    APPLIED = "applied"
    REVIEWING = "reviewing"
    INTERVIEW = "interview"
    OFFER = "offer"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


APPLICATION_STATUSES = tuple(
    status.value for status in ApplicationStatus
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

    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    """Schema returned for an application."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    job_id: UUID
    resume_id: UUID
    status: ApplicationStatus
    cover_letter: str | None
    created_at: datetime
    updated_at: datetime
