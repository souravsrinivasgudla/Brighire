"""Job database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.jobs.models import Job


class JobRepository:
    """Repository for job database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: UUID,
        title: str,
        company: str,
        location: str | None,
        description: str,
        requirements: str | None,
    ) -> Job:
        """Create a job."""

        job = Job(
            user_id=user_id,
            title=title,
            company=company,
            location=location,
            description=description,
            requirements=requirements,
        )

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        return job

    def update(
        self,
        *,
        job: Job,
        title: str | None,
        company: str | None,
        location: str | None,
        description: str | None,
        requirements: str | None,
    ) -> Job:
        """Update a job."""

        if title is not None:
            job.title = title

        if company is not None:
            job.company = company

        if location is not None:
            job.location = location

        if description is not None:
            job.description = description

        if requirements is not None:
            job.requirements = requirements

        self.db.commit()
        self.db.refresh(job)

        return job

    def delete(
        self,
        *,
        job: Job,
    ) -> None:
        """Delete a job."""

        self.db.delete(job)
        self.db.commit()

    def get_by_id(
        self,
        job_id: UUID,
    ) -> Job | None:
        """Get a job by ID."""

        statement = select(Job).where(
            Job.id == job_id
        )

        return self.db.scalar(statement)

    def get_by_user_id(
        self,
        *,
        user_id: UUID,
        search: str | None = None,
        location: str | None = None,
        company: str | None = None,
    ) -> list[Job]:
        """Get jobs belonging to a user with optional filters."""

        statement = select(Job).where(
            Job.user_id == user_id,
        )

        if search:
            search_pattern = f"%{search}%"

            statement = statement.where(
                Job.title.ilike(search_pattern)
                | Job.company.ilike(search_pattern)
                | Job.description.ilike(search_pattern)
                | Job.requirements.ilike(search_pattern)
            )

        if location:
            statement = statement.where(
                Job.location.ilike(f"%{location}%")
            )

        if company:
            statement = statement.where(
                Job.company.ilike(f"%{company}%")
            )

        statement = statement.order_by(
            Job.created_at.desc()
        )

        return list(
            self.db.scalars(statement).all()
        )