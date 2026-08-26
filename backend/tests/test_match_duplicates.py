"""Resume-job match duplicate / race handling tests."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.ai.client import GroqAIClient
from app.jobs.match_repository import ResumeJobMatchRepository
from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def _fake_match_result(**_: Any) -> dict[str, Any]:
    return {
        "match_score": 85,
        "summary": "Strong overlap with the role.",
        "matched_skills": ["Python", "FastAPI"],
        "missing_skills": ["Kubernetes"],
        "strengths": ["Backend experience"],
        "gaps": ["Cloud depth"],
        "recommendations": ["Add deployment examples"],
    }


@pytest.fixture()
def mock_groq_match(monkeypatch: pytest.MonkeyPatch) -> None:
    """Avoid real Groq calls during match tests."""

    monkeypatch.setattr(
        GroqAIClient,
        "analyze_resume_job_match",
        lambda self, **kwargs: _fake_match_result(),
    )


def test_duplicate_match_via_integrity_error_returns_409(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    mock_groq_match: None,
) -> None:
    """IntegrityError on match create maps to controlled 409."""

    user = create_user(db_session, email="match-dup@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    first = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )
    assert first.status_code == 201

    # Simulate a race: pre-check misses the row, insert hits unique constraint.
    monkeypatch.setattr(
        ResumeJobMatchRepository,
        "get_by_resume_and_job",
        lambda self, **kwargs: None,
    )

    raced = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )

    assert raced.status_code == 409
    assert raced.json()["detail"] == (
        "A match for this resume and job already exists."
    )
    assert "IntegrityError" not in raced.json()["detail"]
    assert "UNIQUE" not in raced.json()["detail"]

    monkeypatch.undo()
    listed = client.get(
        f"/api/v1/resumes/{resume.id}/matches",
        headers=headers,
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_match_integrity_error_does_not_become_500(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
    mock_groq_match: None,
) -> None:
    """Forced IntegrityError from create becomes 409, not 500."""

    user = create_user(db_session, email="match-integrity@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    def raise_integrity(self, **kwargs):
        raise IntegrityError(
            "INSERT",
            {},
            Exception("uq_resume_job_match"),
        )

    monkeypatch.setattr(
        ResumeJobMatchRepository,
        "get_by_resume_and_job",
        lambda self, **kwargs: None,
    )
    monkeypatch.setattr(
        ResumeJobMatchRepository,
        "create",
        raise_integrity,
    )

    response = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )

    assert response.status_code == 409
    assert response.status_code != 500
    assert response.json()["detail"] == (
        "A match for this resume and job already exists."
    )


def test_match_create_then_existing_returns_existing(
    client: TestClient,
    db_session: Session,
    mock_groq_match: None,
) -> None:
    """Sequential rematch returns the existing match (not an error)."""

    user = create_user(db_session, email="match-idempotent@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    first = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )
    second = client.post(
        f"/api/v1/jobs/{job.id}/match/{resume.id}",
        headers=headers,
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["id"] == first.json()["id"]

    listed = client.get(
        f"/api/v1/resumes/{resume.id}/matches",
        headers=headers,
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1
