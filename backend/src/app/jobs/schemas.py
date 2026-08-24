"""Job API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    """Schema for creating a job."""

    title: str = Field(
        min_length=1,
        max_length=255,
    )

    company: str = Field(
        min_length=1,
        max_length=255,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    description: str = Field(
        min_length=1,
    )

    requirements: str | None = None

class JobUpdate(BaseModel):
    """Schema for updating a job."""

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    company: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    description: str | None = Field(
        default=None,
        min_length=1,
    )

    requirements: str | None = None

class JobResponse(BaseModel):
    """Schema returned for a job."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    user_id: UUID
    title: str
    company: str
    location: str | None
    description: str
    requirements: str | None
    created_at: datetime
    updated_at: datetime