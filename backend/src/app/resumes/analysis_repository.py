"""Resume analysis database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.resumes.analysis_models import ResumeAnalysis


class ResumeAnalysisRepository:
    """Repository for resume analysis operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create(
        self,
        *,
        resume_id: UUID,
        overall_score: int,
        summary: str,
        skills: list[str],
        strengths: list[str],
        weaknesses: list[str],
        missing_skills: list[str],
        suggestions: list[str],
    ) -> ResumeAnalysis:
        """Create a resume analysis."""

        analysis = ResumeAnalysis(
            resume_id=resume_id,
            overall_score=overall_score,
            summary=summary,
            skills=skills,
            strengths=strengths,
            weaknesses=weaknesses,
            missing_skills=missing_skills,
            suggestions=suggestions,
        )

        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)

        return analysis

    def get_by_resume_id(
        self,
        resume_id: UUID,
    ) -> ResumeAnalysis | None:
        """Get the analysis for a resume."""

        statement = select(ResumeAnalysis).where(
            ResumeAnalysis.resume_id == resume_id
        )

        return self.db.scalar(statement)