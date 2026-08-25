"""User API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.users.models import User
from app.users.repository import UserRepository
from app.users.schemas import (
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.users.service import UserService


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def get_user_service(
    db: Session = Depends(get_db),
) -> UserService:
    """Create a user service."""

    repository = UserRepository(db)

    return UserService(repository)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Create a user."""

    try:
        user = service.create_user(data)

        return UserResponse.model_validate(user)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Get the currently authenticated user."""

    return UserResponse.model_validate(
        current_user,
    )


@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_current_user_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
) -> UserResponse:
    """Update the currently authenticated user's profile."""

    try:
        user = service.update_user(
            user_id=current_user.id,
            data=data,
        )

        return UserResponse.model_validate(user)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc