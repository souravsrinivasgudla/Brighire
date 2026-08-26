"""Authentication API endpoints."""

from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)
from jose import JWTError
from sqlalchemy.orm import Session

from app.auth.schemas import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.core.config import settings
from app.core.database import get_db
from app.core.rate_limit import rate_limit_by_ip
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.users.repository import UserRepository

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

_RESET_MESSAGE = (
    "If an account exists for that email, password reset "
    "instructions are available."
)


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate a user and return an access token."""

    rate_limit_by_ip(
        request,
        action="login",
        limit=5,
    )

    repository = UserRepository(db)

    user = repository.get_by_email(
        str(data.email),
    )

    if user is None or not verify_password(
        data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        str(user.id),
    )

    return TokenResponse(
        access_token=access_token,
    )


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
)
def forgot_password(
    data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    """Start a password reset flow for an email address."""

    rate_limit_by_ip(
        request,
        action="forgot_password",
        limit=5,
    )

    repository = UserRepository(db)
    user = repository.get_by_email(str(data.email))

    if user is None or not user.is_active:
        return ForgotPasswordResponse(message=_RESET_MESSAGE)

    reset_token = create_password_reset_token(str(user.id))

    # Email delivery is not configured yet. In development we return the
    # token so the frontend reset flow can be tested end-to-end.
    if settings.app_env.lower() == "development":
        return ForgotPasswordResponse(
            message=_RESET_MESSAGE,
            reset_token=reset_token,
        )

    return ForgotPasswordResponse(message=_RESET_MESSAGE)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
)
def reset_password(
    data: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> None:
    """Reset a user's password using a valid reset token."""

    rate_limit_by_ip(
        request,
        action="reset_password",
        limit=5,
    )

    try:
        user_id = UUID(decode_password_reset_token(data.token))
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        ) from exc

    repository = UserRepository(db)
    user = repository.get_by_id(user_id)

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    repository.update(
        user=user,
        hashed_password=hash_password(data.new_password),
    )
