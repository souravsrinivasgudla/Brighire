"""Dashboard database queries."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.jobs.match_models import ResumeJobMatch
from app.resumes.analysis_models import ResumeAnalysis
from app.resumes.models import Resume
from app.jobs.models import Job


class DashboardRepository:
    """Repository for candidate dashboard data."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_resume_count(
        self,
        *,
        user_id: UUID,
    ) -> int:
        """Get the number of resumes belonging to a user."""

        statement = (
            select(func.count())
            .select_from(Resume)
            .where(Resume.user_id == user_id)
        )

        return self.db.scalar(statement) or 0

    def get_analysis_count(
        self,
        *,
        user_id: UUID,
    ) -> int:
        """Get the number of analyzed resumes."""

        statement = (
            select(func.count())
            .select_from(ResumeAnalysis)
            .join(
                Resume,
                Resume.id == ResumeAnalysis.resume_id,
            )
            .where(Resume.user_id == user_id)
        )

        return self.db.scalar(statement) or 0

    def get_match_count(
        self,
        *,
        user_id: UUID,
    ) -> int:
        """Get the number of resume-job matches."""

        statement = (
            select(func.count())
            .select_from(ResumeJobMatch)
            .join(
                Resume,
                Resume.id == ResumeJobMatch.resume_id,
            )
            .where(Resume.user_id == user_id)
        )

        return self.db.scalar(statement) or 0

    def get_average_match_score(
        self,
        *,
        user_id: UUID,
    ) -> int | None:
        """Get the average match score."""

        statement = (
            select(func.avg(ResumeJobMatch.match_score))
            .select_from(ResumeJobMatch)
            .join(
                Resume,
                Resume.id == ResumeJobMatch.resume_id,
            )
            .where(Resume.user_id == user_id)
        )

        average = self.db.scalar(statement)

        if average is None:
            return None

        return round(float(average))

    def get_top_matches(
        self,
        *,
        user_id: UUID,
        limit: int = 5,
    ) -> list[tuple[ResumeJobMatch, Job]]:
        """Get the user's highest-scoring matches with job details."""

        statement = (
            select(
                ResumeJobMatch,
                Job,
            )
            .join(
                Resume,
                Resume.id == ResumeJobMatch.resume_id,
            )
            .join(
                Job,
                Job.id == ResumeJobMatch.job_id,
            )
            .where(
                Resume.user_id == user_id,
            )
            .order_by(
                ResumeJobMatch.match_score.desc(),
                ResumeJobMatch.created_at.desc(),
            )
            .limit(limit)
        )

        return [
            (match, job)
            for match, job in self.db.execute(statement).all()
        ]