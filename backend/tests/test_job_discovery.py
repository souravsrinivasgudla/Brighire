"""Job portal MCP discovery tests (no network: in-process MCP server)."""

from __future__ import annotations

import json
from collections.abc import Generator
from typing import Any

import anyio
import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.client import GroqAIClient
from app.job_portals import mcp_server, providers
from app.job_portals.client import JobPortalMCPClient
from app.job_portals.router import get_portal_client
from app.job_portals.schemas import PortalJob
from app.jobs.match_models import ResumeJobMatch
from app.jobs.models import Job
from app.main import app
from tests.conftest import auth_header, create_job, create_resume, create_user


def _portal_job(index: int, *, source: str = "adzuna", **overrides: Any) -> PortalJob:
    data: dict[str, Any] = {
        "source": source,
        "external_id": f"{source}-{index}",
        "title": f"Python Engineer {index}",
        "company": f"Company {index}",
        "location": "Bengaluru",
        "description": "Build FastAPI services.",
        "url": f"https://jobs.example.com/{source}/{index}",
    }
    data.update(overrides)
    return PortalJob(**data)


class FakeProvider:
    def __init__(self, name: str, jobs: list[PortalJob] | Exception) -> None:
        self.name = name
        self.jobs = jobs
        self.calls: list[dict[str, Any]] = []

    async def search(self, **kwargs: Any) -> list[PortalJob]:
        self.calls.append(kwargs)
        if isinstance(self.jobs, Exception):
            raise self.jobs
        return self.jobs[: kwargs["limit"]]


@pytest.fixture()
def portal(monkeypatch: pytest.MonkeyPatch) -> Generator[dict[str, Any], None, None]:
    """Serve fake providers through the real MCP server, in-process."""

    state: dict[str, Any] = {
        "providers": [FakeProvider("adzuna", [_portal_job(i) for i in range(15)])],
    }
    monkeypatch.setattr(mcp_server, "build_providers", lambda _: state["providers"])
    app.dependency_overrides[get_portal_client] = lambda: JobPortalMCPClient(mcp_server.server)

    yield state

    app.dependency_overrides.pop(get_portal_client, None)


@pytest.fixture()
def fake_groq(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    calls: dict[str, Any] = {"suggest": 0, "match": 0}

    def suggest(self: GroqAIClient, resume_text: str) -> dict[str, Any]:
        calls["suggest"] += 1
        return {"queries": ["Python Backend Engineer"], "location": "Bengaluru"}

    def match(self: GroqAIClient, **kwargs: Any) -> dict[str, Any]:
        calls["match"] += 1
        # Score by the trailing index so ranking is deterministic.
        score = 50 + int(kwargs["job_title"].rsplit(" ", 1)[-1])
        return {
            "match_score": min(score, 100),
            "summary": "Good fit.",
            "matched_skills": ["Python"],
            "missing_skills": [],
            "strengths": [],
            "gaps": [],
            "recommendations": [],
        }

    monkeypatch.setattr(GroqAIClient, "suggest_job_searches", suggest)
    monkeypatch.setattr(GroqAIClient, "analyze_resume_job_match", match)
    return calls


def test_discover_imports_dedupes_and_auto_matches_top_ten(
    client: TestClient,
    db_session: Session,
    portal: dict[str, Any],
    fake_groq: dict[str, Any],
) -> None:
    user = create_user(db_session)
    create_resume(db_session, user=user)
    # Already saved by hand: same title + company must be skipped.
    create_job(db_session, user=user, title="Python Engineer 0", company="Company 0")

    response = client.post(
        "/api/v1/jobs/discover",
        json={"limit": 12},
        headers=auth_header(user),
    )

    assert response.status_code == 200, response.text
    body = response.json()

    assert body["queries"] == ["Python Backend Engineer"]
    assert body["location"] == "Bengaluru"
    assert body["skipped_duplicates"] == 1
    # The portal returns 12 listings (the limit); one is a duplicate.
    assert len(body["imported"]) == 11
    assert fake_groq["match"] == 10

    scores = [item["match_score"] for item in body["imported"]]
    assert scores[:10] == sorted(scores[:10], reverse=True)
    assert scores[10:] == [None]

    first = body["imported"][0]["job"]
    assert first["source"] == "adzuna"
    assert first["url"].startswith("https://jobs.example.com/")

    provider_call = portal["providers"][0].calls[0]
    assert provider_call["query"] == "Python Backend Engineer"
    assert provider_call["location"] == "Bengaluru"

    assert db_session.scalar(select(ResumeJobMatch.id).limit(1)) is not None

    # Re-running the same search imports nothing new.
    again = client.post(
        "/api/v1/jobs/discover",
        json={"limit": 12},
        headers=auth_header(user),
    )
    assert again.status_code == 200
    assert again.json()["imported"] == []
    assert again.json()["skipped_duplicates"] == 12
    imported = db_session.scalars(select(Job).where(Job.source.is_not(None))).all()
    assert len(imported) == 11


def test_explicit_query_skips_ai_suggestion(
    client: TestClient,
    db_session: Session,
    portal: dict[str, Any],
    fake_groq: dict[str, Any],
) -> None:
    user = create_user(db_session)
    create_resume(db_session, user=user)

    response = client.post(
        "/api/v1/jobs/discover",
        json={"query": "Go developer", "location": "Pune", "country": "in", "limit": 3},
        headers=auth_header(user),
    )

    assert response.status_code == 200, response.text
    assert fake_groq["suggest"] == 0
    call = portal["providers"][0].calls[0]
    assert call == {"query": "Go developer", "location": "Pune", "country": "in", "limit": 3}


def test_one_failing_portal_does_not_hide_others(
    client: TestClient,
    db_session: Session,
    portal: dict[str, Any],
    fake_groq: dict[str, Any],
) -> None:
    portal["providers"] = [
        FakeProvider("jsearch", RuntimeError("boom")),
        FakeProvider("adzuna", [_portal_job(1)]),
    ]
    user = create_user(db_session)
    create_resume(db_session, user=user)

    response = client.post(
        "/api/v1/jobs/discover",
        json={"limit": 5},
        headers=auth_header(user),
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["imported"]) == 1
    assert body["source_errors"] == ["jsearch: RuntimeError"]


def test_discover_requires_a_resume(
    client: TestClient,
    db_session: Session,
    portal: dict[str, Any],
    fake_groq: dict[str, Any],
) -> None:
    user = create_user(db_session)

    response = client.post("/api/v1/jobs/discover", json={}, headers=auth_header(user))

    assert response.status_code == 409


def test_discover_rejects_another_users_resume(
    client: TestClient,
    db_session: Session,
    portal: dict[str, Any],
    fake_groq: dict[str, Any],
) -> None:
    owner = create_user(db_session)
    resume = create_resume(db_session, user=owner)
    intruder = create_user(db_session)

    response = client.post(
        "/api/v1/jobs/discover",
        json={"resume_id": str(resume.id)},
        headers=auth_header(intruder),
    )

    assert response.status_code == 404


def test_unreachable_mcp_server_returns_503(
    client: TestClient,
    db_session: Session,
    fake_groq: dict[str, Any],
) -> None:
    app.dependency_overrides[get_portal_client] = lambda: JobPortalMCPClient(
        "http://127.0.0.1:9/mcp"
    )
    try:
        user = create_user(db_session)
        create_resume(db_session, user=user)

        response = client.post(
            "/api/v1/jobs/discover",
            json={"query": "python"},
            headers=auth_header(user),
        )
    finally:
        app.dependency_overrides.pop(get_portal_client, None)

    assert response.status_code == 503


def test_discover_requires_auth(client: TestClient) -> None:
    assert client.post("/api/v1/jobs/discover", json={}).status_code == 401


def test_adzuna_provider_normalizes_results(monkeypatch: pytest.MonkeyPatch) -> None:
    seen: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "id": 42,
                        "title": "<strong>Python</strong> Developer",
                        "company": {"display_name": "Acme &amp; Co"},
                        "location": {"display_name": "Bengaluru, Karnataka"},
                        "description": "Build APIs",
                        "redirect_url": "https://adzuna.example/42",
                        "salary_min": 1200000,
                        "salary_max": "nan",
                        "created": "2026-10-01T00:00:00Z",
                    },
                    {"id": None, "title": "skipped"},
                ]
            },
        )

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        providers.httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs),
    )

    provider = providers.AdzunaProvider(app_id="id", app_key="key", timeout=5)
    jobs = anyio.run(
        lambda: provider.search(query="python", location="Bengaluru", country="IN", limit=5)
    )

    assert "/jobs/in/search/1" in seen["url"]
    assert "what=python" in seen["url"] and "where=Bengaluru" in seen["url"]
    assert len(jobs) == 1
    job = jobs[0]
    assert (job.external_id, job.title, job.company) == ("42", "Python Developer", "Acme & Co")
    assert job.salary_min == 1200000 and job.salary_max is None


def test_jsearch_provider_normalizes_results(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["x-rapidapi-key"] == "secret"
        assert request.url.params["query"] == "python in Pune"
        return httpx.Response(
            200,
            content=json.dumps(
                {
                    "data": [
                        {
                            "job_id": "abc",
                            "job_title": "Backend Engineer",
                            "employer_name": "Globex",
                            "job_city": "Pune",
                            "job_country": "IN",
                            "job_description": "FastAPI",
                            "job_apply_link": "https://apply.example/abc",
                            "job_is_remote": True,
                        }
                    ]
                }
            ),
        )

    real_client = httpx.AsyncClient
    monkeypatch.setattr(
        providers.httpx,
        "AsyncClient",
        lambda **kwargs: real_client(transport=httpx.MockTransport(handler), **kwargs),
    )

    provider = providers.JSearchProvider(api_key="secret", timeout=5)
    jobs = anyio.run(
        lambda: provider.search(query="python", location="Pune", country="in", limit=10)
    )

    assert len(jobs) == 1
    assert jobs[0].location == "Pune, IN"
    assert jobs[0].is_remote is True
    assert jobs[0].url == "https://apply.example/abc"


def test_build_providers_only_enables_configured_sources() -> None:
    from app.job_portals.config import JobPortalSettings

    # Keyless free sources are on by default.
    defaults = JobPortalSettings(_env_file=None)  # pyright: ignore[reportCallIssue]
    assert [p.name for p in providers.build_providers(defaults)] == [
        "company_boards",
        "himalayas",
        "remoteok",
    ]

    none = JobPortalSettings(  # pyright: ignore[reportCallIssue]
        _env_file=None,
        company_boards="",
        himalayas_enabled=False,
        remoteok_enabled=False,
    )
    assert providers.build_providers(none) == []

    configured = JobPortalSettings(  # pyright: ignore[reportCallIssue]
        _env_file=None,
        adzuna_app_id="a",
        adzuna_app_key="b",
        jsearch_api_key="c",
        serpapi_api_key="s",
        jooble_api_key="d",
        jobspy_enabled=True,
    )
    assert [p.name for p in providers.build_providers(configured)] == [
        "adzuna",
        "jsearch",
        "google_jobs",
        "jooble",
        "company_boards",
        "himalayas",
        "remoteok",
        "jobspy",
    ]
