"""Application database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.applications.models import Application


class ApplicationRepository:
    """Repository for job application database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: UUID,
        job_id: UUID,
        resume_id: UUID,
        status: str = "applied",
        cover_letter: str | None = None,
    ) -> Application:
        """Create and persist a new application."""

        application = Application(
            user_id=user_id,
            job_id=job_id,
            resume_id=resume_id,
            status=status,
            cover_letter=cover_letter,
        )

        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)

        return application

    def get_by_id(
        self,
        application_id: UUID,
    ) -> Application | None:
        """Get an application by ID."""

        statement = select(Application).where(
            Application.id == application_id,
        )

        return self.db.scalar(statement)

    def get_by_user_and_job(
        self,
        *,
        user_id: UUID,
        job_id: UUID,
    ) -> Application | None:
        """Get an application for a specific user and job."""

        statement = select(Application).where(
            Application.user_id == user_id,
            Application.job_id == job_id,
        )

        return self.db.scalar(statement)

    def get_by_user(
        self,
        *,
        user_id: UUID,
    ) -> list[Application]:
        """Get all applications belonging to a user."""

        statement = (
            select(Application)
            .where(Application.user_id == user_id)
            .order_by(Application.created_at.desc())
        )

        return list(self.db.scalars(statement).all())

    def update(
        self,
        application: Application,
        *,
        status: str,
    ) -> Application:
        """Update an application's status."""

        application.status = status

        self.db.commit()
        self.db.refresh(application)

        return application

    def delete(
        self,
        application: Application,
    ) -> None:
        """Delete an application."""

        self.db.delete(application)
        self.db.commit()