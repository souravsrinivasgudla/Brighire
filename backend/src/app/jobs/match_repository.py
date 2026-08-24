"""Resume-job match database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.jobs.match_models import ResumeJobMatch


class ResumeJobMatchRepository:
    """Repository for resume-job match operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        resume_id: UUID,
        job_id: UUID,
        match_score: int,
        summary: str,
        matched_skills: list[str],
        missing_skills: list[str],
        strengths: list[str],
        gaps: list[str],
        recommendations: list[str],
    ) -> ResumeJobMatch:
        """Create a resume-job match."""

        match = ResumeJobMatch(
            resume_id=resume_id,
            job_id=job_id,
            match_score=match_score,
            summary=summary,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            strengths=strengths,
            gaps=gaps,
            recommendations=recommendations,
        )

        self.db.add(match)
        self.db.commit()
        self.db.refresh(match)

        return match

    def get_by_resume_and_job(
        self,
        *,
        resume_id: UUID,
        job_id: UUID,
    ) -> ResumeJobMatch | None:
        """Get an existing match for a resume and job."""

        statement = select(ResumeJobMatch).where(
            ResumeJobMatch.resume_id == resume_id,
            ResumeJobMatch.job_id == job_id,
        )

        return self.db.scalar(statement)

    def get_by_resume_id(
        self,
        *,
        resume_id: UUID,
    ) -> list[ResumeJobMatch]:
        """Get all job matches for a resume."""

        statement = (
            select(ResumeJobMatch)
            .where(
                ResumeJobMatch.resume_id == resume_id,
            )
            .order_by(
                ResumeJobMatch.match_score.desc(),
            )
        )

        return list(
            self.db.scalars(statement).all()
        )

    def get_by_job_id(
        self,
        *,
        job_id: UUID,
    ) -> list[ResumeJobMatch]:
        """Get all resume matches for a job."""

        statement = (
            select(ResumeJobMatch)
            .where(
                ResumeJobMatch.job_id == job_id,
            )
            .order_by(
                ResumeJobMatch.match_score.desc(),
            )
        )

        return list(
            self.db.scalars(statement).all()
        )