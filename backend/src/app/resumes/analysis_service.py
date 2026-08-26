"""Resume analysis business logic."""

from uuid import UUID

from app.ai.schemas import ResumeAnalysis as AIResumeAnalysis
from app.ai.service import ResumeAIService
from app.resumes.analysis_models import ResumeAnalysis
from app.resumes.analysis_repository import ResumeAnalysisRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    ResourceNotFoundError,
    ResourceNotReadyError,
)


class ResumeAnalysisService:
    """Service for AI-powered resume analysis."""

    def __init__(
        self,
        resume_repository: ResumeRepository,
        analysis_repository: ResumeAnalysisRepository,
        ai_service: ResumeAIService,
    ) -> None:
        self.resume_repository = resume_repository
        self.analysis_repository = analysis_repository
        self.ai_service = ai_service

    def analyze(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> ResumeAnalysis:
        """Analyze a user's resume and persist the result."""

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError("Resume not found.")

        if resume.user_id != user_id:
             raise ResourceNotFoundError(
                "Resume not found."
            )

        if not resume.extracted_text:
            raise ResourceNotReadyError(
                "Resume contains no extractable text."
            )

        existing_analysis = (
            self.analysis_repository.get_by_resume_id(resume_id)
        )

        if existing_analysis is not None:
            return existing_analysis

        analysis: AIResumeAnalysis = self.ai_service.analyze(
            resume.extracted_text
        )

        return self.analysis_repository.create(
            resume_id=resume.id,
            overall_score=analysis.overall_score,
            summary=analysis.summary,
            skills=analysis.skills,
            strengths=analysis.strengths,
            weaknesses=analysis.weaknesses,
            missing_skills=analysis.missing_skills,
            suggestions=analysis.suggestions,
        )
    
    def get_analysis(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> ResumeAnalysis:
        """Get the saved analysis for a user's resume."""

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError("Resume not found.")

        if resume.user_id != user_id:
             raise ResourceNotFoundError(
                "Resume not found."
            )

        analysis = self.analysis_repository.get_by_resume_id(
            resume_id
        )

        if analysis is None:
            raise ResourceNotReadyError(
                "Resume has not been analyzed yet."
            )

        return analysis