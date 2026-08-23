"""Job API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobCreate, JobResponse
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

    return JobService(repository)


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
    response_model=list[JobResponse],
)
def get_jobs(
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service),
) -> list[JobResponse]:
    """Get all jobs belonging to the authenticated user."""

    jobs = service.get_user_jobs(
        user_id=current_user.id,
    )

    return [
        JobResponse.model_validate(job)
        for job in jobs
    ]


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