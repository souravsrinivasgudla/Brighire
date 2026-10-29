"""Profile-based job discovery through the job portal MCP server."""

import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from uuid import UUID

from pydantic import ValidationError

from app.ai.client import GroqAIClient
from app.ai.match_schemas import ResumeJobMatchAIResponse
from app.job_portals.client import JobPortalMCPClient
from app.job_portals.schemas import (
    DiscoveredJob,
    JobDiscoveryRequest,
    JobDiscoveryResponse,
    JobSearchSuggestion,
    PortalJob,
)
from app.jobs.match_service import ResumeJobMatchService
from app.jobs.models import Job
from app.jobs.repository import JobRepository
from app.jobs.schemas import JobResponse
from app.resumes.models import Resume
from app.resumes.repository import ResumeRepository
from app.shared.exceptions import (
    AIProviderRequestError,
    ResourceNotFoundError,
    ResourceNotReadyError,
)

logger = logging.getLogger(__name__)

# Imported jobs scored with the AI right away; the rest can be matched on demand.
AUTO_MATCH_COUNT = 10
_MATCH_WORKERS = 4


class JobDiscoveryService:
    """Find jobs on external portals that fit the user's resume."""

    def __init__(
        self,
        *,
        resume_repository: ResumeRepository,
        job_repository: JobRepository,
        match_service: ResumeJobMatchService,
        ai_client: GroqAIClient,
        portal_client: JobPortalMCPClient,
    ) -> None:
        self.resume_repository = resume_repository
        self.job_repository = job_repository
        self.match_service = match_service
        self.ai_client = ai_client
        self.portal_client = portal_client

    def discover(
        self,
        *,
        user_id: UUID,
        request: JobDiscoveryRequest,
    ) -> JobDiscoveryResponse:
        resume = self._resolve_resume(
            user_id=user_id,
            resume_id=request.resume_id,
        )
        resume_text = resume.extracted_text or ""

        if request.query:
            queries = [request.query]
            location = request.location
        else:
            suggestion = self._suggest_searches(resume_text)
            queries = suggestion.queries[:3]
            location = request.location or suggestion.location

        search = self.portal_client.search(
            queries=queries,
            location=location,
            country=request.country,
            limit=request.limit,
        )

        new_jobs, skipped = self._dedupe(
            user_id=user_id,
            portal_jobs=search.jobs,
            limit=request.limit,
        )

        created = self.job_repository.create_many_imported(
            user_id=user_id,
            jobs=[self._to_job_fields(job) for job in new_jobs],
        )

        scores = self._auto_match(
            resume=resume,
            jobs=created[:AUTO_MATCH_COUNT],
        )

        imported = [
            DiscoveredJob(
                job=JobResponse.model_validate(job),
                match_score=scores.get(job.id),
            )
            for job in created
        ]
        imported.sort(
            key=lambda item: item.match_score if item.match_score is not None else -1,
            reverse=True,
        )

        return JobDiscoveryResponse(
            resume_id=resume.id,
            queries=queries,
            location=location,
            imported=imported,
            skipped_duplicates=skipped,
            source_errors=search.errors,
            discovered_at=datetime.now(UTC),
        )

    def _resolve_resume(
        self,
        *,
        user_id: UUID,
        resume_id: UUID | None,
    ) -> Resume:
        if resume_id is not None:
            resume = self.resume_repository.get_by_id(resume_id)

            if resume is None or resume.user_id != user_id:
                raise ResourceNotFoundError("Resume not found.")
        else:
            # Primary first, then the most recent upload.
            resumes = self.resume_repository.get_by_user_id(user_id)

            if not resumes:
                raise ResourceNotReadyError(
                    "Upload a resume before discovering jobs."
                )

            resume = resumes[0]

        if not resume.extracted_text:
            raise ResourceNotReadyError(
                "Resume contains no extractable text."
            )

        return resume

    def _suggest_searches(self, resume_text: str) -> JobSearchSuggestion:
        result = self.ai_client.suggest_job_searches(resume_text)

        try:
            return JobSearchSuggestion.model_validate(result)
        except ValidationError as exc:
            raise AIProviderRequestError(
                "AI service failed to process the request."
            ) from exc

    def _dedupe(
        self,
        *,
        user_id: UUID,
        portal_jobs: list[PortalJob],
        limit: int,
    ) -> tuple[list[PortalJob], int]:
        """Drop jobs already saved, or repeated across portals / queries."""

        external_keys, title_keys = self.job_repository.get_import_keys(
            user_id=user_id,
        )
        fresh: list[PortalJob] = []
        skipped = 0

        for job in portal_jobs:
            external_key = (job.source, job.external_id)
            title_key = (job.title.strip().lower(), job.company.strip().lower())

            if external_key in external_keys or title_key in title_keys:
                skipped += 1
                continue

            external_keys.add(external_key)
            title_keys.add(title_key)

            if len(fresh) < limit:
                fresh.append(job)

        return fresh, skipped

    @staticmethod
    def _to_job_fields(job: PortalJob) -> dict:
        details = []

        if job.salary_min or job.salary_max:
            low = f"{job.salary_min:,.0f}" if job.salary_min else "?"
            high = f"{job.salary_max:,.0f}" if job.salary_max else "?"
            details.append(f"Salary: {low} - {high}")

        if job.is_remote:
            details.append("Remote")

        if job.posted_at:
            details.append(f"Posted: {job.posted_at}")

        return {
            "title": job.title[:255],
            "company": job.company[:255],
            "location": job.location[:255] if job.location else None,
            "description": job.description,
            "requirements": " · ".join(details) or None,
            "source": job.source[:64],
            "external_id": job.external_id[:255],
            "url": job.url[:2048] if job.url else None,
        }

    def _auto_match(
        self,
        *,
        resume: Resume,
        jobs: list[Job],
    ) -> dict[UUID, int]:
        """Score jobs concurrently; a failed score leaves that job unmatched."""

        if not jobs:
            return {}

        resume_text = resume.extracted_text or ""

        def score(job: Job) -> ResumeJobMatchAIResponse | None:
            try:
                return self.match_service.analyze(
                    resume_text=resume_text,
                    job=job,
                )
            except Exception as exc:  # noqa: BLE001 - a failed score must not fail the import
                logger.warning(
                    "Auto-match failed for job %s: %s",
                    job.id,
                    type(exc).__name__,
                )
                return None

        # Only the AI calls run in threads; the DB session stays on this one.
        with ThreadPoolExecutor(max_workers=_MATCH_WORKERS) as pool:
            analyses = list(pool.map(score, jobs))

        scores: dict[UUID, int] = {}

        for job, analysis in zip(jobs, analyses, strict=True):
            if analysis is None:
                continue

            self.match_service.save_analysis(
                resume_id=resume.id,
                job_id=job.id,
                analysis=analysis,
            )
            scores[job.id] = analysis.match_score

        return scores
