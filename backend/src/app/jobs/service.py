"""Job business logic."""

from uuid import UUID

from app.jobs.models import Job
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobCreate, JobUpdate
from app.shared.exceptions import (
    ResourceAccessDeniedError,
    ResourceNotFoundError,
)


class JobService:
    """Service for job operations."""

    def __init__(
        self,
        repository: JobRepository,
    ) -> None:
        self.repository = repository

    def create_job(
        self,
        *,
        user_id: UUID,
        data: JobCreate,
    ) -> Job:
        """Create a job for the authenticated user."""

        return self.repository.create(
            user_id=user_id,
            title=data.title,
            company=data.company,
            location=data.location,
            description=data.description,
            requirements=data.requirements,
        )

    def get_job(
        self,
        *,
        job_id: UUID,
        user_id: UUID,
    ) -> Job:
        """Get a job owned by the authenticated user."""

        job = self.repository.get_by_id(job_id)

        if job is None:
            raise ResourceNotFoundError(
                "Job not found."
            )

        if job.user_id != user_id:
            raise ResourceAccessDeniedError(
                "You do not have access to this job."
            )

        return job

    def get_user_jobs(
        self,
        *,
        user_id: UUID,
    ) -> list[Job]:
        """Get all jobs belonging to the authenticated user."""

        return self.repository.get_by_user_id(user_id)
    
    def update_job(
        self,
        *,
        job_id: UUID,
        user_id: UUID,
        data: JobUpdate,
    ) -> Job:
        """Update a user's job."""

        job = self.get_job(
            job_id=job_id,
            user_id=user_id,
        )

        return self.repository.update(
            job=job,
            title=data.title,
            company=data.company,
            location=data.location,
            description=data.description,
            requirements=data.requirements,
        )

    def delete_job(
        self,
        *,
        job_id: UUID,
        user_id: UUID,
    ) -> None:
        """Delete a user's job."""

        job = self.get_job(
            job_id=job_id,
            user_id=user_id,
        )

        self.repository.delete(
            job=job,
        )