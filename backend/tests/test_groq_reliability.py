"""Groq AI reliability and failure-mapping tests."""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from groq import APIConnectionError, APIStatusError, APITimeoutError
from httpx import Request, Response
from sqlalchemy.orm import Session

from app.ai.client import GroqAIClient
from app.core.config import settings
from tests.conftest import auth_header, create_resume, create_user

_SAFE_UNAVAILABLE = "AI service is temporarily unavailable."
_SAFE_REQUEST_FAILED = "AI service failed to process the request."


def _fake_analysis_result(**_: Any) -> dict[str, Any]:
    return {
        "overall_score": 82,
        "summary": "Solid backend profile.",
        "skills": ["Python", "FastAPI"],
        "strengths": ["API design"],
        "weaknesses": ["Limited cloud depth"],
        "missing_skills": ["Kubernetes"],
        "suggestions": ["Add deployment examples"],
    }


def _httpx_request() -> Request:
    return Request("POST", "https://api.groq.com/openai/v1/chat/completions")


@pytest.fixture()
def mock_groq_success(monkeypatch: pytest.MonkeyPatch) -> None:
    """Avoid real Groq calls; return a valid analysis payload."""

    monkeypatch.setattr(
        GroqAIClient,
        "analyze_resume",
        lambda self, resume_text: _fake_analysis_result(),
    )


def test_groq_client_uses_configured_timeout() -> None:
    """Groq client must apply settings.groq_timeout_seconds."""

    client = GroqAIClient()

    assert client.client.timeout == settings.groq_timeout_seconds


def test_groq_success_path_unchanged(
    client: TestClient,
    db_session: Session,
    mock_groq_success: None,
) -> None:
    """Successful analysis keeps the existing response shape."""

    user = create_user(db_session, email="groq-success@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["overall_score"] == 82
    assert body["summary"] == "Solid backend profile."
    assert body["skills"] == ["Python", "FastAPI"]
    assert body["resume_id"] == str(resume.id)
    assert "id" in body
    assert "created_at" in body


def test_groq_timeout_returns_503(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Timeouts map to controlled 503 without provider details."""

    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = APITimeoutError(
        request=_httpx_request(),
    )
    monkeypatch.setattr(
        GroqAIClient,
        "__init__",
        lambda self: setattr(self, "client", fake_client),
    )

    user = create_user(db_session, email="groq-timeout@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 503
    assert response.json()["detail"] == _SAFE_UNAVAILABLE
    assert "Request timed out" not in response.json()["detail"]
    assert "api.groq.com" not in response.text
    assert settings.groq_api_key not in response.text


def test_groq_connection_failure_returns_503(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Connection failures map to controlled 503."""

    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = APIConnectionError(
        message="Connection refused to secret-host",
        request=_httpx_request(),
    )
    monkeypatch.setattr(
        GroqAIClient,
        "__init__",
        lambda self: setattr(self, "client", fake_client),
    )

    user = create_user(db_session, email="groq-conn@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 503
    assert response.json()["detail"] == _SAFE_UNAVAILABLE
    assert "Connection refused" not in response.text
    assert "secret-host" not in response.text


def test_groq_bad_response_returns_502(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Provider API failures map to controlled 502."""

    request = _httpx_request()
    response_obj = Response(500, request=request)
    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = APIStatusError(
        message="provider leaked stacktrace KEY=abc123",
        response=response_obj,
        body={"error": "internal"},
    )
    monkeypatch.setattr(
        GroqAIClient,
        "__init__",
        lambda self: setattr(self, "client", fake_client),
    )

    user = create_user(db_session, email="groq-bad@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 502
    assert response.json()["detail"] == _SAFE_REQUEST_FAILED
    assert "stacktrace" not in response.text
    assert "KEY=abc123" not in response.text
    assert "provider leaked" not in response.text


def test_groq_invalid_json_returns_502(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Invalid provider JSON maps to controlled 502."""

    message = MagicMock()
    message.content = "not-json{{"
    choice = MagicMock()
    choice.message = message
    completion = MagicMock()
    completion.choices = [choice]

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = completion
    monkeypatch.setattr(
        GroqAIClient,
        "__init__",
        lambda self: setattr(self, "client", fake_client),
    )

    user = create_user(db_session, email="groq-json@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 502
    assert response.json()["detail"] == _SAFE_REQUEST_FAILED
    assert "JSONDecodeError" not in response.text
    assert "not-json" not in response.text


def test_provider_errors_do_not_leak_to_clients(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """API clients must never see raw Groq exception text."""

    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = APITimeoutError(
        request=_httpx_request(),
    )
    monkeypatch.setattr(
        GroqAIClient,
        "__init__",
        lambda self: setattr(self, "client", fake_client),
    )

    user = create_user(db_session, email="groq-leak@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    body = response.json()
    assert response.status_code == 503
    assert body == {"detail": _SAFE_UNAVAILABLE}
    assert "traceback" not in response.text.lower()
    assert "APITimeoutError" not in response.text


def test_groq_invalid_schema_returns_502(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Valid JSON with an invalid analysis schema maps to controlled 502."""

    monkeypatch.setattr(
        GroqAIClient,
        "analyze_resume",
        lambda self, resume_text: {
            "overall_score": "not-an-int",
            "summary": "bad schema",
        },
    )

    user = create_user(db_session, email="groq-schema@example.com")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    response = client.post(
        f"/api/v1/resumes/{resume.id}/analyze",
        headers=headers,
    )

    assert response.status_code == 502
    assert response.json()["detail"] == _SAFE_REQUEST_FAILED
    assert "ValidationError" not in response.text
    assert "overall_score" not in response.json()["detail"]
    assert response.status_code != 500
