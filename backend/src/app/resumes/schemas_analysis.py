"""Resume analysis API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ResumeAnalysisResponse(BaseModel):
    """Response schema for AI resume analysis."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    resume_id: UUID
    overall_score: int = Field(
        ge=0,
        le=100,
    )
    summary: str
    skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    missing_skills: list[str]
    suggestions: list[str]
    created_at: datetime
    updated_at: datetime