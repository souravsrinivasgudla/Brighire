"""Job business logic."""

import math
from uuid import UUID

from app.jobs.models import Job
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobCreate, JobUpdate
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    ResourceAccessDeniedError,
    ResourceNotFoundError,
)


class JobService:
    """Service for job operations."""

    def __init__(
        self,
        repository: JobRepository,
        resume_repository: ResumeRepository,
    ) -> None:
        self.repository = repository
        self.resume_repository = resume_repository

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
        search: str | None = None,
        location: str | None = None,
        company: str | None = None,
        page: int = 1,
        page_size: int = 10,
        sort_by: str = "created_at",
        resume_id: UUID | None = None,
    ) -> tuple[list[Job], int, int]:
        """Get paginated jobs with optional filtering and sorting."""

        if page < 1:
            raise ValueError(
                "Page must be greater than or equal to 1."
            )

        if page_size < 1:
            raise ValueError(
                "Page size must be greater than or equal to 1."
            )

        if page_size > 100:
            raise ValueError(
                "Page size cannot exceed 100."
            )

        allowed_sort_fields = {
            "created_at",
            "title",
            "company",
            "match_score",
        }

        if sort_by not in allowed_sort_fields:
            raise ValueError(
                "Invalid sort field. "
                "Allowed values: created_at, title, company, match_score."
            )

        if sort_by == "match_score" and resume_id is None:
            raise ValueError(
                "resume_id is required when sorting by match_score."
            )

        if resume_id is not None:
            resume = self.resume_repository.get_by_id(
                resume_id
            )

            if resume is None:
                raise ResourceNotFoundError(
                    "Resume not found."
                )

            if resume.user_id != user_id:
                raise ResourceAccessDeniedError(
                    "You do not have access to this resume."
                )

        offset = (page - 1) * page_size

        jobs, total = self.repository.get_by_user_id(
            user_id=user_id,
            search=search,
            location=location,
            company=company,
            offset=offset,
            limit=page_size,
            sort_by=sort_by,
            resume_id=resume_id,
        )

        pages = math.ceil(total / page_size)

        return jobs, total, pages
    
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