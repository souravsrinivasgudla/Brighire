"""Job portal schemas shared by the MCP server, client, and API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.jobs.schemas import JobResponse


class PortalJob(BaseModel):
    """A job listing normalized across portals."""

    source: str
    external_id: str
    title: str
    company: str
    location: str | None = None
    description: str
    url: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    is_remote: bool | None = None
    posted_at: str | None = None


class JobSearchResult(BaseModel):
    """Result of the ``search_jobs`` MCP tool."""

    jobs: list[PortalJob]

    # Per-source failures, so one broken portal does not hide the others.
    errors: list[str] = Field(default_factory=list)


class JobSearchSuggestion(BaseModel):
    """Search queries the AI derives from a resume."""

    queries: list[str] = Field(min_length=1, max_length=5)
    location: str | None = None


class JobDiscoveryRequest(BaseModel):
    """Request to discover jobs for the user's profile."""

    resume_id: UUID | None = None

    query: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    location: str | None = Field(
        default=None,
        max_length=255,
    )

    country: str | None = Field(
        default=None,
        pattern="^[a-zA-Z]{2}$",
    )

    limit: int = Field(
        default=20,
        ge=1,
        le=50,
    )


class DiscoveredJob(BaseModel):
    """An imported job with its match score, when one was computed."""

    job: JobResponse
    match_score: int | None


class JobDiscoveryResponse(BaseModel):
    """Outcome of a discovery run."""

    resume_id: UUID
    queries: list[str]
    location: str | None
    imported: list[DiscoveredJob]
    skipped_duplicates: int
    source_errors: list[str]
    discovered_at: datetime
