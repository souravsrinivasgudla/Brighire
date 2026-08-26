"""Authentication security tests."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import create_user


def test_inactive_user_cannot_log_in(
    client: TestClient,
    db_session: Session,
) -> None:
    """Inactive accounts must not receive access tokens."""

    create_user(
        db_session,
        email="inactive@example.com",
        password="password123",
        is_active=False,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "inactive@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."
    assert "access_token" not in response.json()


def test_invalid_credentials_return_401(
    client: TestClient,
    db_session: Session,
) -> None:
    """Wrong password must return a generic 401."""

    create_user(
        db_session,
        email="active@example.com",
        password="password123",
        is_active=True,
    )

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "active@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_unknown_email_returns_401(
    client: TestClient,
) -> None:
    """Unknown email must also return a generic 401."""

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "missing@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."
