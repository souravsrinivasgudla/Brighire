"""Resume API endpoints."""

from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.resumes.models import Resume
from app.resumes.repository import ResumeRepository
from app.resumes.schemas import ResumeResponse
from app.resumes.service import ResumeService
from app.users.models import User


STORAGE_DIRECTORY = (
    Path(__file__).resolve().parents[3] / "storage" / "resumes"
)


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


def get_resume_service(
    db: Session = Depends(get_db),
) -> ResumeService:
    """Create a resume service."""

    repository = ResumeRepository(db)

    return ResumeService(
        repository=repository,
        storage_directory=STORAGE_DIRECTORY,
    )


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