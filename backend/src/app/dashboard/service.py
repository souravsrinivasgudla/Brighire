"""Dashboard business logic."""

from uuid import UUID

from app.dashboard.repository import DashboardRepository
from app.dashboard.schemas import (
    DashboardMatch,
    DashboardResponse,
    DashboardResume,
    DashboardResumeResponse,
)
from app.resumes.schemas_analysis import ResumeAnalysisResponse
from app.shared.exceptions import ResourceNotFoundError


class DashboardService:
    """Service for candidate dashboard data."""

    def __init__(
        self,
        repository: DashboardRepository,
    ) -> None:
        self.repository = repository

    def get_dashboard(
        self,
        *,
        user_id: UUID,
    ) -> DashboardResponse:
        """Build the candidate dashboard summary."""

        resume_count = self.repository.get_resume_count(
            user_id=user_id,
        )

        primary = self.repository.get_primary_resume(
            user_id=user_id,
        )

        if primary is None:
            return DashboardResponse(
                resume_count=resume_count,
                analysis_count=0,
                match_count=0,
                average_match_score=None,
                primary_resume_id=None,
                primary_filename=None,
                top_matches=[],
            )

        analysis = self.repository.get_resume_analysis(
            resume_id=primary.id,
        )

        match_count = self.repository.get_resume_match_count(
            resume_id=primary.id,
        )

        average_match_score = (
            self.repository.get_resume_average_match_score(
                resume_id=primary.id,
            )
        )

        top_matches = [
            DashboardMatch(
                id=match.id,
                resume_id=match.resume_id,
                job_id=match.job_id,
                job_title=job.title,
                company=job.company,
                location=job.location,
                match_score=match.match_score,
                summary=match.summary,
            )
            for match, job in self.repository.get_resume_top_matches(
                resume_id=primary.id,
                limit=5,
            )
        ]

        return DashboardResponse(
            resume_count=resume_count,
            analysis_count=1 if analysis is not None else 0,
            match_count=match_count,
            average_match_score=average_match_score,
            primary_resume_id=primary.id,
            primary_filename=primary.filename,
            top_matches=top_matches,
        )

    def get_resume_dashboard(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> DashboardResumeResponse:
        """Build dashboard data for a specific resume."""

        resume = self.repository.get_resume(
            resume_id=resume_id,
            user_id=user_id,
        )

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        analysis = self.repository.get_resume_analysis(
            resume_id=resume_id,
        )

        match_count = self.repository.get_resume_match_count(
            resume_id=resume_id,
        )

        average_match_score = (
            self.repository.get_resume_average_match_score(
                resume_id=resume_id,
            )
        )

        top_matches = [
            DashboardMatch(
                id=match.id,
                resume_id=match.resume_id,
                job_id=match.job_id,
                job_title=job.title,
                company=job.company,
                location=job.location,
                match_score=match.match_score,
                summary=match.summary,
            )
            for match, job in self.repository.get_resume_top_matches(
                resume_id=resume_id,
                limit=5,
            )
        ]

        return DashboardResumeResponse(
            resume=DashboardResume(
                id=resume.id,
                filename=resume.filename,
                created_at=resume.created_at,
            ),
            analysis=(
                ResumeAnalysisResponse.model_validate(analysis)
                if analysis is not None
                else None
            ),
            match_count=match_count,
            average_match_score=average_match_score,
            top_matches=top_matches,
        )