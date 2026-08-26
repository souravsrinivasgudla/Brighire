"""Security utilities for authentication."""

from datetime import UTC, datetime, timedelta

from jose import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Hash a plaintext password."""

    return password_hash.hash(password)


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    """Verify a plaintext password against its hash."""

    return password_hash.verify(password, hashed_password)


def create_access_token(subject: str) -> str:
    """Create a JWT access token."""

    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": subject,
        "exp": expires_at,
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def create_password_reset_token(subject: str) -> str:
    """Create a short-lived JWT for password reset."""

    expires_at = datetime.now(UTC) + timedelta(minutes=30)

    payload = {
        "sub": subject,
        "exp": expires_at,
        "type": "password_reset",
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=settings.algorithm,
    )


def decode_password_reset_token(token: str) -> str:
    """Decode a password-reset JWT and return the subject user id."""

    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )

    if payload.get("type") != "password_reset":
        raise ValueError("Invalid password reset token.")

    subject = payload.get("sub")
    if not subject or not isinstance(subject, str):
        raise ValueError("Invalid password reset token.")

    return subject
