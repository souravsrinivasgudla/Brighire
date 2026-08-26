"""Rate limiting security tests."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import (
    FakeRedis,
    auth_header,
    create_resume,
    create_user,
)


def test_login_endpoint_is_rate_limited(
    client: TestClient,
    fake_redis: FakeRedis,
) -> None:
    """The 6th login attempt from the same IP must return 429."""

    payload = {
        "email": "ratelimit-login@example.com",
        "password": "password123",
    }

    for _ in range(5):
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 401

    limited = client.post("/api/v1/auth/login", json=payload)

    assert limited.status_code == 429
    assert "Too many requests" in limited.json()["detail"]
    assert limited.headers.get("Retry-After") == "60"


def test_registration_endpoint_is_rate_limited(
    client: TestClient,
    fake_redis: FakeRedis,
) -> None:
    """The 6th registration attempt from the same IP must return 429."""

    for index in range(5):
        response = client.post(
            "/api/v1/users",
            json={
                "email": f"register-{index}@example.com",
                "full_name": "Rate Limit User",
                "password": "password123",
            },
        )
        assert response.status_code == 201

    limited = client.post(
        "/api/v1/users",
        json={
            "email": "register-overflow@example.com",
            "full_name": "Rate Limit User",
            "password": "password123",
        },
    )

    assert limited.status_code == 429
    assert "Too many requests" in limited.json()["detail"]


def test_resume_analysis_endpoint_is_rate_limited(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """The 11th analysis request for a user must return 429."""

    user = create_user(db_session, email="analyze-limit@example.com")
    headers = auth_header(user)
    missing_resume_id = uuid4()

    for _ in range(10):
        response = client.post(
            f"/api/v1/resumes/{missing_resume_id}/analyze",
            headers=headers,
        )
        # Rate limit runs before ownership/AI work.
        assert response.status_code == 404

    limited = client.post(
        f"/api/v1/resumes/{missing_resume_id}/analyze",
        headers=headers,
    )

    assert limited.status_code == 429
    assert "Too many requests" in limited.json()["detail"]


def test_job_match_endpoint_is_rate_limited(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """The 11th match request for a user must return 429."""

    user = create_user(db_session, email="match-limit@example.com")
    resume = create_resume(db_session, user=user)
    foreign_job_id = uuid4()
    headers = auth_header(user)

    for _ in range(10):
        response = client.post(
            f"/api/v1/jobs/{foreign_job_id}/match/{resume.id}",
            headers=headers,
        )
        assert response.status_code == 404

    limited = client.post(
        f"/api/v1/jobs/{foreign_job_id}/match/{resume.id}",
        headers=headers,
    )

    assert limited.status_code == 429
    assert "Too many requests" in limited.json()["detail"]
