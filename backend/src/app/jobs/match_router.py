"""Resume-job matching API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.ai.client import GroqAIClient
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.core.rate_limit import rate_limit_by_user
from app.jobs.match_repository import ResumeJobMatchRepository
from app.jobs.match_schemas import ResumeJobMatchResponse
from app.jobs.match_service import ResumeJobMatchService
from app.jobs.repository import JobRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    AIProviderRequestError,
    AIProviderUnavailableError,
    ResourceConflictError,
    ResourceNotFoundError,
    ResourceNotReadyError,
)
from app.users.models import User

router = APIRouter(
    prefix="/jobs",
    tags=["Job Matching"],
)


def get_match_service(
    db: Session = Depends(get_db),
) -> ResumeJobMatchService:
    """Create the resume-job match service."""

    resume_repository = ResumeRepository(db)

    job_repository = JobRepository(db)

    match_repository = ResumeJobMatchRepository(db)

    ai_client = GroqAIClient()

    return ResumeJobMatchService(
        resume_repository=resume_repository,
        job_repository=job_repository,
        match_repository=match_repository,
        ai_client=ai_client,
    )


@router.post(
    "/{job_id}/match/{resume_id}",
    response_model=ResumeJobMatchResponse,
)
def create_match(
    job_id: UUID,
    resume_id: UUID,
    response: Response,
    current_user: User = Depends(get_current_user),
    service: ResumeJobMatchService = Depends(
        get_match_service,
    ),
) -> ResumeJobMatchResponse:
    """Match a resume against a job."""

    rate_limit_by_user(
        user_id=str(current_user.id),
        action="job_match",
        limit=10,
    )

    try:
        match, created = service.match(
            resume_id=resume_id,
            job_id=job_id,
            user_id=current_user.id,
        )

        if created:
            response.status_code = status.HTTP_201_CREATED

        return ResumeJobMatchResponse.model_validate(
            match
        )


    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except ResourceNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except AIProviderUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    except AIProviderRequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc


@router.get(
    "/{job_id}/match/{resume_id}",
    response_model=ResumeJobMatchResponse,
)
def get_match(
    job_id: UUID,
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ResumeJobMatchService = Depends(
        get_match_service,
    ),
) -> ResumeJobMatchResponse:
    """Get an existing resume-job match."""

    try:
        match = service.get_match(
            resume_id=resume_id,
            job_id=job_id,
            user_id=current_user.id,
        )

        return ResumeJobMatchResponse.model_validate(
            match
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
