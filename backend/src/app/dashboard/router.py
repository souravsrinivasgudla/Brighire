"""Candidate dashboard API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.dashboard.repository import DashboardRepository
from app.dashboard.schemas import DashboardResponse
from app.dashboard.service import DashboardService
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