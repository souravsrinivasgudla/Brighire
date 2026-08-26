"""Resume-job matching business logic."""

from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app.ai.client import GroqAIClient
from app.ai.match_schemas import ResumeJobMatchAIResponse
from app.jobs.match_models import ResumeJobMatch
from app.jobs.match_repository import ResumeJobMatchRepository
from app.jobs.repository import JobRepository
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    AIProviderRequestError,
    ResourceConflictError,
    ResourceNotFoundError,
    ResourceNotReadyError,
)


class ResumeJobMatchService:
    """Service for AI-powered resume-job matching."""

    def __init__(
        self,
        resume_repository: ResumeRepository,
        job_repository: JobRepository,
        match_repository: ResumeJobMatchRepository,
        ai_client: GroqAIClient,
    ) -> None:
        self.resume_repository = resume_repository
        self.job_repository = job_repository
        self.match_repository = match_repository
        self.ai_client = ai_client

    def match(
        self,
        *,
        resume_id: UUID,
        job_id: UUID,
        user_id: UUID,
    ) -> tuple[ResumeJobMatch, bool]:
        """Match a user's resume against a job."""

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if resume.user_id != user_id:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if not resume.extracted_text:
            raise ResourceNotReadyError(
                "Resume contains no extractable text."
            )

        job = self.job_repository.get_by_id(job_id)

        if job is None:
            raise ResourceNotFoundError(
                "Job not found."
            )

        if job.user_id != user_id:
            raise ResourceNotFoundError(
                "Job not found."
            )

        existing_match = (
            self.match_repository.get_by_resume_and_job(
                resume_id=resume_id,
                job_id=job_id,
            )
        )

        if existing_match is not None:
            return existing_match, False

        ai_result = self.ai_client.analyze_resume_job_match(
            resume_text=resume.extracted_text,
            job_title=job.title,
            company=job.company,
            job_description=job.description,
            requirements=job.requirements,
        )

        try:
            analysis = ResumeJobMatchAIResponse.model_validate(
                ai_result
            )
        except ValidationError as exc:
            raise AIProviderRequestError(
                "AI service failed to process the request."
            ) from exc

        try:
            match = self.match_repository.create(
                resume_id=resume_id,
                job_id=job_id,
                match_score=analysis.match_score,
                summary=analysis.summary,
                matched_skills=analysis.matched_skills,
                missing_skills=analysis.missing_skills,
                strengths=analysis.strengths,
                gaps=analysis.gaps,
                recommendations=analysis.recommendations,
            )
        except IntegrityError:
            self.match_repository.db.rollback()
            raise ResourceConflictError(
                "A match for this resume and job already exists."
            ) from None

        return match, True

    def get_match(
        self,
        *,
        resume_id: UUID,
        job_id: UUID,
        user_id: UUID,
    ) -> ResumeJobMatch:
        """Get an existing match."""

        self._verify_access(
            resume_id=resume_id,
            job_id=job_id,
            user_id=user_id,
        )

        match = self.match_repository.get_by_resume_and_job(
            resume_id=resume_id,
            job_id=job_id,
        )

        if match is None:
            raise ResourceNotReadyError(
                "Resume has not been matched against this job yet."
            )

        return match

    def _verify_access(
        self,
        *,
        resume_id: UUID,
        job_id: UUID,
        user_id: UUID,
    ) -> None:
        """Verify that the user owns both resources."""

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if resume.user_id != user_id:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        job = self.job_repository.get_by_id(job_id)

        if job is None:
            raise ResourceNotFoundError(
                "Job not found."
            )

        if job.user_id != user_id:
            raise ResourceNotFoundError(
                "Job not found."
            )

    def get_resume_matches(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> list[ResumeJobMatch]:
        """Get all job matches for a user's resume."""

        resume = self.resume_repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if resume.user_id != user_id:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        return self.match_repository.get_by_resume_id(
            resume_id=resume_id,
        )
