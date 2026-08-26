"""Application business logic."""

from uuid import UUID

from app.applications.models import Application
from app.applications.repository import ApplicationRepository
from app.applications.schemas import APPLICATION_STATUSES
from app.jobs.repository import JobRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    ResourceConflictError,
    ResourceNotFoundError,
)


class ApplicationService:
    """Service for managing job applications."""

    def __init__(
        self,
        *,
        application_repository: ApplicationRepository,
        job_repository: JobRepository,
        resume_repository: ResumeRepository,
    ) -> None:
        self.application_repository = application_repository
        self.job_repository = job_repository
        self.resume_repository = resume_repository

    def create(
        self,
        *,
        user_id: UUID,
        job_id: UUID,
        resume_id: UUID,
        cover_letter: str | None = None,
    ) -> Application:
        """Create a new application."""

        job = self.job_repository.get_by_id(job_id)

        if job is None:
            raise ResourceNotFoundError(
                "Job not found."
            )

        if job.user_id != user_id:
            raise ResourceNotFoundError(
                "Job not found."
            )

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if resume.user_id != user_id:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        existing_application = (
            self.application_repository.get_by_user_and_job(
                user_id=user_id,
                job_id=job_id,
            )
        )

        if existing_application is not None:
            raise ResourceConflictError(
                "You have already applied to this job."
            )

        return self.application_repository.create(
            user_id=user_id,
            job_id=job_id,
            resume_id=resume_id,
            cover_letter=cover_letter,
        )

    def get(
        self,
        *,
        application_id: UUID,
        user_id: UUID,
    ) -> Application:
        """Get an application belonging to the authenticated user."""

        application = self.application_repository.get_by_id(
            application_id
        )

        if application is None:
            raise ResourceNotFoundError(
                "Application not found."
            )

        if application.user_id != user_id:
            raise ResourceNotFoundError(
                "Application not found."
            )

        return application

    def get_user_applications(
        self,
        *,
        user_id: UUID,
    ) -> list[Application]:
        """Get all applications belonging to a user."""

        return self.application_repository.get_by_user(
            user_id=user_id,
        )

    def update_status(
        self,
        *,
        application_id: UUID,
        user_id: UUID,
        status: str,
    ) -> Application:
        """Update the status of an application."""

        application = self.get(
            application_id=application_id,
            user_id=user_id,
        )

        if status not in APPLICATION_STATUSES:
            raise ValueError(
                f"Invalid application status: {status}."
            )

        return self.application_repository.update(
            application,
            status=status,
        )

    def delete(
        self,
        *,
        application_id: UUID,
        user_id: UUID,
    ) -> None:
        """Delete an application belonging to the authenticated user."""

        application = self.get(
            application_id=application_id,
            user_id=user_id,
        )

        self.application_repository.delete(application)