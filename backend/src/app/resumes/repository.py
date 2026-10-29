"""Resume database operations."""

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.resumes.models import Resume


class ResumeRepository:
    """Repository for resume database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        user_id: UUID,
        filename: str,
        storage_path: str,
        extracted_text: str | None,
        is_primary: bool = False,
    ) -> Resume:
        """Create a resume record."""

        resume = Resume(
            user_id=user_id,
            filename=filename,
            storage_path=storage_path,
            extracted_text=extracted_text,
            is_primary=is_primary,
        )

        self.db.add(resume)
        self.db.commit()
        self.db.refresh(resume)

        return resume

    def get_by_id(
        self,
        resume_id: UUID,
    ) -> Resume | None:
        """Get a resume by ID."""

        statement = select(Resume).where(Resume.id == resume_id)

        return self.db.scalar(statement)

    def get_by_user_id(
        self,
        user_id: UUID,
    ) -> list[Resume]:
        """Get all resumes belonging to a user."""

        statement = (
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.is_primary.desc(), Resume.created_at.desc())
        )

        return list(self.db.scalars(statement).all())

    def get_primary_by_user_id(
        self,
        *,
        user_id: UUID,
    ) -> Resume | None:
        """Get the user's primary resume, if one is set."""

        statement = select(Resume).where(
            Resume.user_id == user_id,
            Resume.is_primary.is_(True),
        )

        return self.db.scalar(statement)

    def set_as_primary(
        self,
        *,
        resume: Resume,
    ) -> Resume:
        """Mark a resume as the user's only primary resume."""

        self.db.execute(
            update(Resume)
            .where(
                Resume.user_id == resume.user_id,
                Resume.is_primary.is_(True),
                Resume.id != resume.id,
            )
            .values(is_primary=False)
        )

        resume.is_primary = True
        self.db.commit()
        self.db.refresh(resume)

        return resume

    def delete(
        self,
        *,
        resume: Resume,
    ) -> None:
        """Delete a resume."""

        self.db.delete(resume)
        self.db.commit()