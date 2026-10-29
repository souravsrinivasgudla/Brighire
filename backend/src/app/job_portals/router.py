"""Job discovery API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.client import GroqAIClient
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.core.rate_limit import rate_limit_by_user
from app.job_portals.client import JobPortalMCPClient
from app.job_portals.schemas import JobDiscoveryRequest, JobDiscoveryResponse
from app.job_portals.service import JobDiscoveryService
from app.jobs.match_repository import ResumeJobMatchRepository
from app.jobs.match_service import ResumeJobMatchService
from app.jobs.repository import JobRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    AIProviderRequestError,
    AIProviderUnavailableError,
    JobPortalUnavailableError,
    ResourceNotFoundError,
    ResourceNotReadyError,
)
from app.users.models import User

router = APIRouter(
    prefix="/jobs",
    tags=["Job Discovery"],
)


def get_portal_client() -> JobPortalMCPClient:
    """Create the job portal MCP client."""

    return JobPortalMCPClient()


def get_discovery_service(
    db: Session = Depends(get_db),
    portal_client: JobPortalMCPClient = Depends(get_portal_client),
) -> JobDiscoveryService:
    """Create the job discovery service."""

    resume_repository = ResumeRepository(db)
    job_repository = JobRepository(db)
    ai_client = GroqAIClient()

    match_service = ResumeJobMatchService(
        resume_repository=resume_repository,
        job_repository=job_repository,
        match_repository=ResumeJobMatchRepository(db),
        ai_client=ai_client,
    )

    return JobDiscoveryService(
        resume_repository=resume_repository,
        job_repository=job_repository,
        match_service=match_service,
        ai_client=ai_client,
        portal_client=portal_client,
    )


@router.post(
    "/discover",
    response_model=JobDiscoveryResponse,
)
def discover_jobs(
    data: JobDiscoveryRequest,
    current_user: User = Depends(get_current_user),
    service: JobDiscoveryService = Depends(get_discovery_service),
) -> JobDiscoveryResponse:
    """Find portal jobs that fit the user's resume and import them."""

    # Each run fans out to portals and up to ~11 AI calls.
    rate_limit_by_user(
        user_id=str(current_user.id),
        action="job_discover",
        limit=5,
        window_seconds=600,
    )

    try:
        return service.discover(
            user_id=current_user.id,
            request=data,
        )

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except (AIProviderUnavailableError, JobPortalUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except AIProviderRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
