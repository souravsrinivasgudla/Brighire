"""Candidate dashboard API endpoints."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.dashboard.repository import DashboardRepository
from app.dashboard.schemas import DashboardResponse, DashboardResumeResponse
from app.dashboard.service import DashboardService
from app.shared.exceptions import ResourceNotFoundError
from app.users.models import User

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_dashboard_service(
    db: Session = Depends(get_db),
) -> DashboardService:
    """Create the dashboard service."""

    repository = DashboardRepository(db)

    return DashboardService(
        repository=repository,
    )


@router.get(
    "",
    response_model=DashboardResponse,
)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(
        get_dashboard_service,
    ),
) -> DashboardResponse:
    """Get the authenticated user's dashboard."""

    return service.get_dashboard(
        user_id=current_user.id,
    )

@router.get(
    "/resumes/{resume_id}",
    response_model=DashboardResumeResponse,
)
def get_resume_dashboard(
    resume_id: UUID,
    current_user: User = Depends(get_current_user),
    service: DashboardService = Depends(
        get_dashboard_service,
    ),
) -> DashboardResumeResponse:
    """Get dashboard data for a specific resume."""

    try:
        return service.get_resume_dashboard(
            resume_id=resume_id,
            user_id=current_user.id,
        )

    except ResourceNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc