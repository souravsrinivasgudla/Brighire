"""AI resume-job matching schemas."""

from pydantic import BaseModel, Field


class ResumeJobMatchAIResponse(BaseModel):
    """Structured response returned by the AI."""

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