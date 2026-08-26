"""Application API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.applications.repository import ApplicationRepository
from app.applications.schemas import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationUpdate,
)
from app.applications.service import ApplicationService
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.jobs.repository import JobRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    ResourceConflictError,
    ResourceNotFoundError,
)
from app.users.models import User

router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


def get_application_service(
    db: Session = Depends(get_db),
) -> ApplicationService:
    """Create the application service."""

    application_repository = ApplicationRepository(db)
    job_repository = JobRepository(db)
    resume_repository = ResumeRepository(db)

    return ApplicationService(
        application_repository=application_repository,
        job_repository=job_repository,
        resume_repository=resume_repository,
    )


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_application(
    data: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    service: ApplicationService = Depends(
        get_application_service,
    ),
) -> ApplicationResponse:
    """Create a job application."""

    try:
        application = service.create(
            user_id=current_user.id,
            job_id=data.job_id,
            resume_id=data.resume_id,
            cover_letter=data.cover_letter,
        )

        return ApplicationResponse.model_validate(
            application
        )

    except ResourceConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=list[ApplicationResponse],
)
def get_applications(
    current_user: User = Depends(get_current_user),
    service: ApplicationService = Depends(
        get_application_service,
    ),
) -> list[ApplicationResponse]:
    """Get all applications belonging to the authenticated user."""

    applications = service.get_user_applications(
        user_id=current_user.id,
    )

    return [
        ApplicationResponse.model_validate(application)
        for application in applications
    ]


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def get_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ApplicationService = Depends(
        get_application_service,
    ),
) -> ApplicationResponse:
    """Get an application belonging to the authenticated user."""

    try:
        application = service.get(
            application_id=application_id,
            user_id=current_user.id,
        )

        return ApplicationResponse.model_validate(
            application
        )

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{application_id}",
    response_model=ApplicationResponse,
)
def update_application_status(
    application_id: UUID,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    service: ApplicationService = Depends(
        get_application_service,
    ),
) -> ApplicationResponse:
    """Update the status of an application."""

    try:
        application = service.update_status(
            application_id=application_id,
            user_id=current_user.id,
            status=data.status,
        )

        return ApplicationResponse.model_validate(
            application
        )

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


@router.delete(
    "/{application_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_application(
    application_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ApplicationService = Depends(
        get_application_service,
    ),
) -> None:
    """Delete an application belonging to the authenticated user."""

    try:
        service.delete(
            application_id=application_id,
            user_id=current_user.id,
        )

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc