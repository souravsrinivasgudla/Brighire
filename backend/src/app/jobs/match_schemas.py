"""Resume-job matching API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ResumeJobMatchResponse(BaseModel):
    """Schema returned for a resume-job match."""

    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    resume_id: UUID
    job_id: UUID

    match_score: int = Field(
        ge=0,
        le=100,
    )

    summary: str

    matched_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    gaps: list[str]
    recommendations: list[str]

    created_at: datetime
    updated_at: datetime