"""Rate limiting security tests."""

from uuid import uuid4

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.rate_limit import check_rate_limit
from app.users.models import User
from tests.conftest import (
    FakeRedis,
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def test_login_within_limit_does_not_return_429(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """Requests within the login limit are not rate limited."""

    create_user(
        db_session,
        email="within-login@example.com",
        password="password123",
    )
    payload = {
        "email": "within-login@example.com",
        "password": "password123",
    }

    for _ in range(5):
        response = client.post("/api/v1/auth/login", json=payload)
        assert response.status_code == 200
        assert "access_token" in response.json()


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


def test_redis_unavailable_on_login_returns_503(
    client: TestClient,
    fake_redis: FakeRedis,
) -> None:
    """Redis outages fail closed with a controlled 503 on login."""

    fake_redis.unavailable = True

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "redis-down@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail == "Rate limiting service is temporarily unavailable."
    assert "localhost" not in detail
    assert "6379" not in detail
    assert "traceback" not in detail.lower()
    assert "Redis" not in detail
    assert "access_token" not in response.json()


def test_redis_unavailable_on_register_returns_503(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """Redis outages fail closed with a controlled 503 on registration."""

    fake_redis.unavailable = True
    email = "redis-register@example.com"

    response = client.post(
        "/api/v1/users",
        json={
            "email": email,
            "full_name": "Redis Down",
            "password": "password123",
        },
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail == "Rate limiting service is temporarily unavailable."
    assert "RedisError" not in response.text
    assert "ConnectionError" not in response.text
    # Rate limiting must not be bypassed: no user row created.
    assert (
        db_session.scalars(
            select(User).where(User.email == email)
        ).first()
        is None
    )


def test_redis_unavailable_on_analyze_returns_503(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """Redis outages fail closed with a controlled 503 on resume analysis."""

    user = create_user(db_session, email="redis-analyze@example.com")
    resume = create_resume(db_session, user=user)
    fake_redis.unavailable = True

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=auth_header(user),
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail == "Rate limiting service is temporarily unavailable."
    assert "Redis" not in detail
    assert "traceback" not in response.text.lower()


def test_redis_unavailable_on_match_returns_503(
    client: TestClient,
    db_session: Session,
    fake_redis: FakeRedis,
) -> None:
    """Redis outages fail closed with a controlled 503 on job matching."""

    user = create_user(db_session, email="redis-match@example.com")
    resume = create_resume(db_session, user=user)
    job = create_job(db_session, user=user)
    fake_redis.unavailable = True

    response = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=auth_header(user),
    )

    assert response.status_code == 503
    detail = response.json()["detail"]
    assert detail == "Rate limiting service is temporarily unavailable."
    assert "Redis" not in detail
    assert "Connection refused" not in response.text


def test_pipeline_increments_and_sets_expiry(
    fake_redis: FakeRedis,
) -> None:
    """Pipeline incr + expire update the shared FakeRedis state."""

    check_rate_limit(key="rate_limit:test:pipeline", limit=5, window_seconds=60)

    assert fake_redis.counts["rate_limit:test:pipeline"] == 1
    assert fake_redis.ttls["rate_limit:test:pipeline"] == 60

    check_rate_limit(key="rate_limit:test:pipeline", limit=5, window_seconds=60)

    assert fake_redis.counts["rate_limit:test:pipeline"] == 2
    assert fake_redis.ttls["rate_limit:test:pipeline"] == 60


def test_rate_limit_counters_are_isolated_by_key(
    fake_redis: FakeRedis,
) -> None:
    """Counters for different IP/user/action keys do not share state."""

    login_key = "rate_limit:ip:login:127.0.0.1"
    register_key = "rate_limit:ip:register:127.0.0.1"
    user_a_key = f"rate_limit:user:resume_analysis:{uuid4()}"
    user_b_key = f"rate_limit:user:resume_analysis:{uuid4()}"

    for _ in range(5):
        check_rate_limit(key=login_key, limit=5)

    with pytest.raises(HTTPException) as login_exc:
        check_rate_limit(key=login_key, limit=5)

    assert login_exc.value.status_code == 429

    # A different action key remains under its own limit.
    check_rate_limit(key=register_key, limit=5)
    assert fake_redis.counts[register_key] == 1
    assert fake_redis.counts[login_key] == 6

    for _ in range(10):
        check_rate_limit(key=user_a_key, limit=10)

    with pytest.raises(HTTPException) as user_a_exc:
        check_rate_limit(key=user_a_key, limit=10)

    assert user_a_exc.value.status_code == 429

    check_rate_limit(key=user_b_key, limit=10)
    assert fake_redis.counts[user_b_key] == 1
    assert fake_redis.counts[user_a_key] == 11


def test_redis_failure_does_not_leak_internal_details(
    fake_redis: FakeRedis,
) -> None:
    """Redis failures map to HTTPException without exposing internals."""

    fake_redis.unavailable = True

    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit(key="rate_limit:test:fail", limit=5)

    assert exc_info.value.status_code == 503
    detail = str(exc_info.value.detail)
    assert detail == "Rate limiting service is temporarily unavailable."
    assert "Redis is unavailable" not in detail
    assert "localhost" not in detail
