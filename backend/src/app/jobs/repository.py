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
        user_id: UUID,
    ) -> list[Job]:
        """Get all jobs belonging to a user."""

        statement = (
            select(Job)
            .where(Job.user_id == user_id)
            .order_by(Job.created_at.desc())
        )

        return list(self.db.scalars(statement).all())