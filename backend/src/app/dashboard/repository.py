"""Dashboard database queries."""

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.jobs.match_models import ResumeJobMatch
from app.jobs.models import Job
from app.resumes.analysis_models import ResumeAnalysis
from app.resumes.models import Resume


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

    def get_primary_resume(
        self,
        *,
        user_id: UUID,
    ) -> Resume | None:
        """Get the user's primary resume, falling back to the latest."""

        primary = self.db.scalar(
            select(Resume).where(
                Resume.user_id == user_id,
                Resume.is_primary.is_(True),
            )
        )

        if primary is not None:
            return primary

        return self.db.scalar(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )

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

    def get_resume(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> Resume | None:
        """Get a user's resume by ID."""

        statement = (
            select(Resume)
            .where(
                Resume.id == resume_id,
                Resume.user_id == user_id,
            )
        )

        return self.db.scalar(statement)


    def get_resume_analysis(
        self,
        *,
        resume_id: UUID,
    ) -> ResumeAnalysis | None:
        """Get the analysis for a resume."""

        statement = (
            select(ResumeAnalysis)
            .where(
                ResumeAnalysis.resume_id == resume_id,
            )
        )

        return self.db.scalar(statement)


    def get_resume_match_count(
        self,
        *,
        resume_id: UUID,
    ) -> int:
        """Get the number of matches for a resume."""

        statement = (
            select(func.count())
            .select_from(ResumeJobMatch)
            .where(
                ResumeJobMatch.resume_id == resume_id,
            )
        )

        return self.db.scalar(statement) or 0


    def get_resume_average_match_score(
        self,
        *,
        resume_id: UUID,
    ) -> int | None:
        """Get the average match score for a resume."""

        statement = (
            select(func.avg(ResumeJobMatch.match_score))
            .select_from(ResumeJobMatch)
            .where(
                ResumeJobMatch.resume_id == resume_id,
            )
        )

        average = self.db.scalar(statement)

        if average is None:
            return None

        return round(float(average))


    def get_resume_top_matches(
        self,
        *,
        resume_id: UUID,
        limit: int = 5,
    ) -> list[tuple[ResumeJobMatch, Job]]:
        """Get the highest-scoring jobs for a resume."""

        statement = (
            select(
                ResumeJobMatch,
                Job,
            )
            .join(
                Job,
                Job.id == ResumeJobMatch.job_id,
            )
            .where(
                ResumeJobMatch.resume_id == resume_id,
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