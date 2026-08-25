"""Job API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobCreate, JobResponse, JobUpdate, JobListResponse
from app.resumes.repository import ResumeRepository
from app.jobs.service import JobService
from app.shared.exceptions import (
    ResourceAccessDeniedError,
    ResourceNotFoundError,
)
from app.users.models import User


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


def get_job_service(
    db: Session = Depends(get_db),
) -> JobService:
    """Create a job service."""

    repository = JobRepository(db)
    resume_repository = ResumeRepository(db)

    return JobService(repository, resume_repository)


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job(
    data: JobCreate,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> JobResponse:
    """Create a job for the authenticated user."""

    job = service.create_job(
        user_id=current_user.id,
        data=data,
    )

    return JobResponse.model_validate(job)


@router.get(
    "",
    response_model=JobListResponse,
)
def get_jobs(
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
    ),
    location: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),
    company: str | None = Query(
        default=None,
        min_length=1,
        max_length=255,
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    sort_by: str = Query(
        default="created_at",
        pattern="^(created_at|title|company|match_score)$",
    ),
    resume_id: UUID | None = Query(
        default=None,
    ),
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> JobListResponse:
    """Get paginated jobs with filtering and sorting."""

    try:
        jobs, total, pages = service.get_user_jobs(
            user_id=current_user.id,
            search=search,
            location=location,
            company=company,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            resume_id=resume_id,
        )

        return JobListResponse(
            items=[
                JobResponse.model_validate(job)
                for job in jobs
            ],
            page=page,
            page_size=page_size,
            total=total,
            pages=pages,
        )

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> JobResponse:
    """Get a specific job."""

    try:
        job = service.get_job(
            job_id=job_id,
            user_id=current_user.id,
        )

        return JobResponse.model_validate(job)

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: UUID,
    data: JobUpdate,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> JobResponse:
    """Update a job owned by the authenticated user."""

    try:
        job = service.update_job(
            job_id=job_id,
            user_id=current_user.id,
            data=data,
        )

        return JobResponse.model_validate(job)

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> None:
    """Delete a job owned by the authenticated user."""

    try:
        service.delete_job(
            job_id=job_id,
            user_id=current_user.id,
        )

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc