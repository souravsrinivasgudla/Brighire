"""AI analysis schemas."""

from pydantic import BaseModel, Field


class ResumeAnalysis(BaseModel):
    """Structured AI analysis of a resume."""

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