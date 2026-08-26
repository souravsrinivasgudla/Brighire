"""Authentication schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Login request."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    """Request a password reset."""

    email: EmailStr


class ForgotPasswordResponse(BaseModel):
    """Password reset request response."""

    message: str
    reset_token: str | None = None


class ResetPasswordRequest(BaseModel):
    """Reset password using a reset token."""

    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)
