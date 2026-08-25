"""Dashboard API schemas."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DashboardMatch(BaseModel):
    """Summary of a top resume-job match."""

    id: UUID
    resume_id: UUID
    job_id: UUID

    job_title: str
    company: str
    location: str | None

    match_score: int
    summary: str


class DashboardResponse(BaseModel):
    """Candidate dashboard summary."""

    resume_count: int
    analysis_count: int
    match_count: int
    average_match_score: int | None
    top_matches: list[DashboardMatch]