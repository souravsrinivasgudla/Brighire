"""Resume API endpoints."""

from pathlib import Path
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.jobs.match_repository import ResumeJobMatchRepository
from app.jobs.match_schemas import ResumeJobMatchResponse
from app.jobs.match_service import ResumeJobMatchService
from app.jobs.repository import JobRepository

from app.ai.client import GroqAIClient
from app.ai.service import ResumeAIService
from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.resumes.analysis_repository import ResumeAnalysisRepository
from app.resumes.analysis_service import ResumeAnalysisService
from app.resumes.models import Resume
from app.resumes.repository import ResumeRepository
from app.resumes.schemas import ResumeResponse
from app.resumes.schemas_analysis import ResumeAnalysisResponse
from app.resumes.service import ResumeService
from app.shared.exceptions import (
    ResourceAccessDeniedError,
    ResourceNotFoundError,
    ResourceNotReadyError,
)
from app.users.models import User


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

STORAGE_DIRECTORY = (
    Path(__file__).resolve().parents[3] / "storage" / "resumes"
)


# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


# ---------------------------------------------------------------------------
# Resume service dependency
# ---------------------------------------------------------------------------

def get_resume_service(
    db: Session = Depends(get_db),
) -> ResumeService:
    """Create a resume service."""

    repository = ResumeRepository(db)

    return ResumeService(
        repository=repository,
        storage_directory=STORAGE_DIRECTORY,
    )


# ---------------------------------------------------------------------------
# Resume analysis service dependency
# ---------------------------------------------------------------------------

def get_resume_analysis_service(
    db: Session = Depends(get_db),
) -> ResumeAnalysisService:
    """Create a resume analysis service."""

    resume_repository = ResumeRepository(db)

    analysis_repository = ResumeAnalysisRepository(db)

    ai_client = GroqAIClient()

    ai_service = ResumeAIService(ai_client)

    return ResumeAnalysisService(
        resume_repository=resume_repository,
        analysis_repository=analysis_repository,
        ai_service=ai_service,
    )

# ---------------------------------------------------------------------------
# Resume-job match service dependency
# ---------------------------------------------------------------------------

def get_resume_match_service(
    db: Session = Depends(get_db),
) -> ResumeJobMatchService:
    """Create the resume-job match service."""

    resume_repository = ResumeRepository(db)

    job_repository = JobRepository(db)

    match_repository = ResumeJobMatchRepository(db)

    ai_client = GroqAIClient()

    return ResumeJobMatchService(
        resume_repository=resume_repository,
        job_repository=job_repository,
        match_repository=match_repository,
        ai_client=ai_client,
    )

# ---------------------------------------------------------------------------
# Upload resume
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=ResumeResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    service: ResumeService = Depends(get_resume_service),
) -> Resume:
    """Upload and process a resume."""

    try:
        return service.create_resume(
            user_id=current_user.id,
            file=file,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Analyze resume
# ---------------------------------------------------------------------------

@router.post(
    "/{resume_id}/analyze",
    response_model=ResumeAnalysisResponse,
)
def analyze_resume(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ResumeAnalysisService = Depends(
        get_resume_analysis_service,
    ),
) -> ResumeAnalysisResponse:
    """Analyze a resume using AI."""

    try:
        analysis = service.analyze(
            resume_id=resume_id,
            user_id=current_user.id,
        )

        return ResumeAnalysisResponse.model_validate(analysis)

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Get analysis
# ---------------------------------------------------------------------------

@router.get(
    "/{resume_id}/analysis",
    response_model=ResumeAnalysisResponse,
)
def get_resume_analysis(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ResumeAnalysisService = Depends(
        get_resume_analysis_service,
    ),
) -> ResumeAnalysisResponse:
    """Get the saved AI analysis for a resume."""

    try:
        analysis = service.get_analysis(
            resume_id=resume_id,
            user_id=current_user.id,
        )

        return ResumeAnalysisResponse.model_validate(analysis)

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except ResourceNotReadyError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

# ---------------------------------------------------------------------------
# Get resume job matches
# ---------------------------------------------------------------------------

@router.get(
    "/{resume_id}/matches",
    response_model=list[ResumeJobMatchResponse],
)
def get_resume_matches(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ResumeJobMatchService = Depends(
        get_resume_match_service,
    ),
) -> list[ResumeJobMatchResponse]:
    """Get all job matches for a resume."""

    try:
        matches = service.get_resume_matches(
            resume_id=resume_id,
            user_id=current_user.id,
        )

        return [
            ResumeJobMatchResponse.model_validate(match)
            for match in matches
        ]

    except ResourceAccessDeniedError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc