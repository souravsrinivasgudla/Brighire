"""API router registration and error-handling consistency tests."""

from __future__ import annotations

from collections import Counter

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def _openapi_route_keys() -> list[tuple[str, str]]:
    """Collect (path, method) pairs from the OpenAPI schema."""

    paths = app.openapi()["paths"]
    keys: list[tuple[str, str]] = []

    for path, operations in paths.items():
        for method in operations:
            if method.lower() in {"head", "options"}:
                continue
            keys.append((path, method.lower()))

    return keys


def test_no_duplicate_route_mounting() -> None:
    """Each API path+method must be registered exactly once."""

    keys = _openapi_route_keys()
    counts = Counter(keys)
    duplicates = {
        key: count for key, count in counts.items() if count > 1
    }

    assert duplicates == {}

    # Root welcome lives at /, not also under /api/v1/.
    assert ("/", "get") in counts
    assert ("/api/v1/", "get") not in counts
    assert ("/api/v1/health", "get") in counts


def test_root_endpoint_available_once(
    client: TestClient,
) -> None:
    """Root remains available at / and is not duplicated under /api/v1/."""

    root = client.get("/")
    assert root.status_code == 200
    assert root.json()["message"] == "Welcome to Brighire API"

    nested = client.get("/api/v1/")
    assert nested.status_code == 404


def test_analyze_resume_without_text_returns_409(
    client: TestClient,
    db_session: Session,
) -> None:
    """ResourceNotReadyError on analyze maps to controlled 409."""

    user = create_user(db_session, email="ready-analyze@example.com")
    resume = create_resume(
        db_session,
        user=user,
        extracted_text="",
    )
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Resume contains no extractable text."
    )
    assert response.status_code != 500


def test_get_analysis_before_analyze_returns_409(
    client: TestClient,
    db_session: Session,
) -> None:
    """Missing analysis maps ResourceNotReadyError to 409."""

    user = create_user(db_session, email="ready-get-analysis@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.get(
        f"/api/v1/resumes/{resume.id}/analysis",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Resume has not been analyzed yet."
    )
    assert response.status_code != 404
    assert response.status_code != 500


def test_match_resume_without_text_returns_409(
    client: TestClient,
    db_session: Session,
) -> None:
    """ResourceNotReadyError on match create maps to controlled 409."""

    user = create_user(db_session, email="ready-match@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(
        db_session,
        user=user,
        extracted_text="",
    )
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Resume contains no extractable text."
    )
    assert response.status_code != 500


def test_get_match_before_create_returns_409(
    client: TestClient,
    db_session: Session,
) -> None:
    """Missing match maps ResourceNotReadyError to 409."""

    user = create_user(db_session, email="ready-get-match@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.get(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Resume has not been matched against this job yet."
    )
    assert response.status_code != 404
    assert response.status_code != 500
