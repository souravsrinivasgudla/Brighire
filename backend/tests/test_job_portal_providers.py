"""Free job source adapters, tested against recorded response shapes."""

from __future__ import annotations

import json
from collections.abc import Callable
from typing import Any

import anyio
import httpx
import pytest

from app.job_portals import providers
from app.job_portals.schemas import PortalJob

Handler = Callable[[httpx.Request], httpx.Response]

# Captured before any test patches ``httpx.AsyncClient``.
_RealAsyncClient = httpx.AsyncClient


@pytest.fixture(autouse=True)
def _clear_cache() -> None:
    providers._json_cache.clear()


def _mock_http(monkeypatch: pytest.MonkeyPatch, handler: Handler) -> list[httpx.Request]:
    requests: list[httpx.Request] = []

    def record(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return handler(request)

    monkeypatch.setattr(
        providers.httpx,
        "AsyncClient",
        lambda **kwargs: _RealAsyncClient(transport=httpx.MockTransport(record), **kwargs),
    )
    return requests


def _search(provider: Any, **kwargs: Any) -> list[PortalJob]:
    params = {"query": "Backend Engineer", "location": "Bengaluru", "country": "in", "limit": 10}
    params.update(kwargs)
    return anyio.run(lambda: provider.search(**params))


GREENHOUSE = {
    "jobs": [
        {
            "id": 1,
            "title": "Senior Backend Engineer, India",
            "company_name": "GitLab",
            "location": {"name": "Bangalore, India"},
            # Greenhouse double-escapes its HTML.
            "content": "&lt;h2&gt;About&lt;/h2&gt;&lt;p&gt;Build &amp;amp; ship APIs.&lt;/p&gt;",
            "absolute_url": "https://job-boards.greenhouse.io/gitlab/jobs/1",
            "first_published": "2026-10-01T00:00:00Z",
        },
        {
            "id": 2,
            "title": "Backend Engineer",
            "company_name": "GitLab",
            "location": {"name": "San Francisco, CA"},
            "content": "US only",
            "absolute_url": "https://example.com/2",
        },
        {
            "id": 3,
            "title": "Security Engineer",
            "company_name": "GitLab",
            "location": {"name": "Bangalore, India"},
            "content": "Wrong field",
            "absolute_url": "https://example.com/3",
        },
        {
            "id": 4,
            "title": "Backend Engineer",
            "company_name": "GitLab",
            "location": {"name": "Remote"},
            "content": "Anywhere",
            "absolute_url": "https://example.com/4",
        },
    ]
}

LEVER = [
    {
        "id": "abc",
        "text": "Backend Engineer II",
        "categories": {"location": "Bangalore, Karnataka", "allLocations": ["Bangalore, Karnataka"]},
        "descriptionPlain": "Join Meesho.",
        "lists": [{"text": "What you'll do", "content": "<li>Build services</li>"}],
        "additionalPlain": "Equal opportunity.",
        "hostedUrl": "https://jobs.lever.co/meesho/abc",
        "workplaceType": "onsite",
        "createdAt": 1792767640768,
    }
]

ASHBY = {
    "jobs": [
        {
            "id": "a1",
            "title": "Backend Engineer",
            "location": "Hyderabad, India",
            "secondaryLocations": [],
            "isListed": True,
            "isRemote": True,
            "workplaceType": "Hybrid",
            "descriptionPlain": "Notion India.",
            "jobUrl": "https://jobs.ashbyhq.com/notion/a1",
            "publishedAt": "2026-08-24T14:44:49.699+00:00",
        },
        {
            # Flagged isRemote but really a US hybrid office job.
            "id": "a2",
            "title": "Backend Engineer",
            "location": "San Francisco, California",
            "secondaryLocations": [{"location": "New York, New York"}],
            "isListed": True,
            "isRemote": True,
            "workplaceType": "Hybrid",
            "descriptionPlain": "US.",
            "jobUrl": "https://jobs.ashbyhq.com/notion/a2",
        },
        {
            "id": "a3",
            "title": "Backend Engineer",
            "location": "Bengaluru",
            "isListed": False,
            "descriptionPlain": "Unlisted.",
            "jobUrl": "https://jobs.ashbyhq.com/notion/a3",
        },
    ]
}


def _boards_handler(request: httpx.Request) -> httpx.Response:
    url = str(request.url)

    if "greenhouse.io/v1/boards/gitlab" in url:
        assert request.url.params["content"] == "true"
        return httpx.Response(200, json=GREENHOUSE)
    if "api.lever.co/v0/postings/meesho" in url:
        return httpx.Response(200, json=LEVER)
    if "posting-api/job-board/notion" in url:
        return httpx.Response(200, json=ASHBY)

    return httpx.Response(404, json={"error": "not found"})


def test_company_boards_filter_by_field_and_location(monkeypatch: pytest.MonkeyPatch) -> None:
    _mock_http(monkeypatch, _boards_handler)
    provider = providers.CompanyBoardsProvider(
        boards=[
            ("greenhouse", "gitlab", "GitLab"),
            ("lever", "meesho", "Meesho"),
            ("ashby", "notion", "Notion"),
            # A closed board must not break the others.
            ("greenhouse", "closed-company", "Closed"),
        ],
        timeout=5,
    )

    jobs = _search(provider)
    ids = {job.external_id for job in jobs}

    assert ids == {"gitlab:1", "gitlab:4", "meesho:abc", "notion:a1"}

    gitlab = next(job for job in jobs if job.external_id == "gitlab:1")
    assert gitlab.source == "greenhouse"
    assert gitlab.description == "About\n\nBuild & ship APIs."
    assert gitlab.url == "https://job-boards.greenhouse.io/gitlab/jobs/1"

    meesho = next(job for job in jobs if job.external_id == "meesho:abc")
    assert meesho.company == "Meesho"
    assert "Build services" in meesho.description
    assert meesho.posted_at is not None and meesho.posted_at.startswith("2026-")


def test_company_boards_are_fetched_once_per_run(monkeypatch: pytest.MonkeyPatch) -> None:
    requests = _mock_http(monkeypatch, _boards_handler)
    provider = providers.CompanyBoardsProvider(
        boards=[("greenhouse", "gitlab", "GitLab")],
        timeout=5,
    )

    _search(provider, query="Backend Engineer")
    _search(provider, query="Senior Backend Engineer")

    assert len(requests) == 1


def test_company_boards_cap_results_per_company(monkeypatch: pytest.MonkeyPatch) -> None:
    many = {
        "jobs": [
            {
                "id": i,
                "title": f"Backend Engineer {i}",
                "company_name": "BigCo" if i < 8 else "SmallCo",
                "location": {"name": "Bengaluru"},
                "content": "x",
            }
            for i in range(10)
        ]
    }
    _mock_http(monkeypatch, lambda _: httpx.Response(200, json=many))
    provider = providers.CompanyBoardsProvider(boards=[("greenhouse", "big", "BigCo")], timeout=5)

    jobs = _search(provider, limit=6)

    # SmallCo is not crowded out by BigCo's larger board.
    assert [job.company for job in jobs].count("SmallCo") == 2
    assert len(jobs) == 6


def test_himalayas_passes_country_and_normalizes(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["q"] == "Backend Engineer"
        assert request.url.params["country"] == "India"
        return httpx.Response(
            200,
            json={
                "jobs": [
                    {
                        "title": "Backend Engineer",
                        "companyName": "lemon.io",
                        "description": "<p>Remote role</p>",
                        "locationRestrictions": ["India", "Nepal"],
                        "minSalary": 40000,
                        "maxSalary": None,
                        "pubDate": 1792087770,
                        "applicationLink": "https://himalayas.app/companies/lemon-io/jobs/x",
                        "guid": "https://himalayas.app/companies/lemon-io/jobs/x",
                    },
                    {"title": "", "guid": "skip"},
                ]
            },
        )

    _mock_http(monkeypatch, handler)

    jobs = _search(providers.HimalayasProvider(timeout=5))

    assert len(jobs) == 1
    job = jobs[0]
    assert job.location == "Remote (India, Nepal)"
    assert job.is_remote is True
    assert job.salary_min == 40000 and job.salary_max is None
    assert job.description == "Remote role"


def test_remoteok_skips_notice_and_jobs_closed_to_country(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["user-agent"]
        return httpx.Response(
            200,
            json=[
                {"last_updated": 1, "legal": "API Terms of Service: link back to Remote OK"},
                {
                    "id": "1",
                    "position": "Senior Engineer",
                    "company": "Wagmo",
                    "tags": ["backend", "python"],
                    "location": "",
                    "description": "<p>Worldwide</p>",
                    "salary_min": 0,
                    "salary_max": 140000,
                    "url": "https://remoteOK.com/remote-jobs/1",
                    "date": "2026-10-26T08:00:06+00:00",
                },
                {
                    "id": "2",
                    "position": "Backend Engineer",
                    "company": "USCo",
                    "tags": [],
                    "location": "United States",
                    "url": "https://remoteOK.com/remote-jobs/2",
                },
                {
                    "id": "3",
                    "position": "Designer",
                    "company": "Other",
                    "tags": ["design"],
                    "location": "Worldwide",
                    "url": "https://remoteOK.com/remote-jobs/3",
                },
            ],
        )

    _mock_http(monkeypatch, handler)

    jobs = _search(providers.RemoteOKProvider(timeout=5))

    # Matched through its tags; the US-only and unrelated jobs are dropped.
    assert [job.external_id for job in jobs] == ["1"]
    assert jobs[0].salary_min is None and jobs[0].salary_max == 140000
    assert jobs[0].url == "https://remoteOK.com/remote-jobs/1"


def test_jooble_posts_query_and_normalizes(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/api/secret-key"
        body = json.loads(request.read())
        assert body["keywords"] == "Backend Engineer"
        assert body["location"] == "Bengaluru"
        return httpx.Response(
            200,
            json={
                "totalCount": 1,
                "jobs": [
                    {
                        "id": -123,
                        "title": "Backend Engineer",
                        "company": "Acme",
                        "location": "Bengaluru, Karnataka",
                        "snippet": "&nbsp;...build <b>APIs</b>...",
                        "type": "Full-time",
                        "link": "https://jooble.org/desc/-123",
                        "updated": "2026-10-20T00:00:00.0000000",
                    }
                ],
            },
        )

    _mock_http(monkeypatch, handler)

    jobs = _search(providers.JoobleProvider(api_key="secret-key", timeout=5))

    assert len(jobs) == 1
    assert jobs[0].external_id == "-123"
    assert jobs[0].description == "...build APIs..."
    assert jobs[0].url == "https://jooble.org/desc/-123"


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (
            "greenhouse:gitlab, lever:cred=CRED ,ashby:sarvam=Sarvam AI",
            [
                ("greenhouse", "gitlab", "Gitlab"),
                ("lever", "cred", "CRED"),
                ("ashby", "sarvam", "Sarvam AI"),
            ],
        ),
        ("workday:acme,greenhouse:,nonsense,,", []),
    ],
)
def test_parse_company_boards(value: str, expected: list[tuple[str, str, str]]) -> None:
    assert providers.parse_company_boards(value) == expected


@pytest.mark.parametrize(
    ("job_location", "is_remote", "expected"),
    [
        ("Bangalore, India", None, True),
        ("Hyderabad, India", None, True),
        ("San Francisco, CA", None, False),
        ("Remote", None, True),
        ("Remote - US", None, False),
        ("San Francisco, California, New York", True, False),
        ("", None, True),
    ],
)
def test_location_matching(job_location: str, is_remote: bool | None, expected: bool) -> None:
    assert (
        providers._location_matches(
            job_location,
            location="Bengaluru",
            country="in",
            is_remote=is_remote,
        )
        is expected
    )


@pytest.mark.parametrize(
    ("query", "title", "matches"),
    [
        ("Data Engineer", "Senior Data Engineer", True),
        ("Data Engineer", "Lead Security Engineer", False),
        ("Senior Python Backend Engineer", "Backend Engineer", True),
        ("Senior Python Backend Engineer", "Software Engineer", False),
        ("Go developer", "Senior Go Engineer", True),
    ],
)
def test_title_relevance(query: str, title: str, matches: bool) -> None:
    assert (providers._title_relevance(query, title) >= 0.5) is matches


def _serp_job(index: int) -> dict[str, Any]:
    return {
        "job_id": f"eyJqb2JfdGl0bGUiOiJ{'x' * 300}{index}",
        "title": f"Backend Engineer {index}",
        "company_name": "Flipkart",
        "location": "Bengaluru, Karnataka",
        "via": "LinkedIn",
        "description": "Build services.",
        "job_highlights": [{"title": "Qualifications", "items": ["3+ years Python"]}],
        "apply_options": [{"title": "LinkedIn", "link": f"https://linkedin.example/{index}"}],
        "share_link": "https://google.example/share",
        "detected_extensions": {"posted_at": "2 days ago", "work_from_home": True},
    }


def test_serpapi_google_jobs_paginates_and_normalizes(monkeypatch: pytest.MonkeyPatch) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        params = request.url.params
        assert params["engine"] == "google_jobs"
        assert params["q"] == "Backend Engineer Bengaluru"
        assert params["gl"] == "in"
        assert params["api_key"] == "serp-key"

        if "next_page_token" not in params:
            return httpx.Response(
                200,
                json={
                    "jobs_results": [_serp_job(i) for i in range(10)],
                    "serpapi_pagination": {"next_page_token": "page-2"},
                },
            )

        assert params["next_page_token"] == "page-2"
        return httpx.Response(200, json={"jobs_results": [_serp_job(10), _serp_job(11)]})

    requests = _mock_http(monkeypatch, handler)
    provider = providers.SerpApiGoogleJobsProvider(api_key="serp-key", max_pages=2, timeout=5)

    jobs = _search(provider, limit=15)

    assert len(requests) == 2
    assert len(jobs) == 12
    job = jobs[0]
    assert job.source == "google_jobs"
    assert len(job.external_id) == 40
    assert len({j.external_id for j in jobs}) == 12
    assert job.url == "https://linkedin.example/0"
    assert job.is_remote is True
    assert "- 3+ years Python" in job.description


def test_serpapi_respects_page_cap(monkeypatch: pytest.MonkeyPatch) -> None:
    requests = _mock_http(
        monkeypatch,
        lambda _: httpx.Response(
            200,
            json={
                "jobs_results": [_serp_job(i) for i in range(10)],
                "serpapi_pagination": {"next_page_token": "more"},
            },
        ),
    )
    provider = providers.SerpApiGoogleJobsProvider(api_key="k", max_pages=1, timeout=5)

    assert len(_search(provider, limit=20)) == 10
    assert len(requests) == 1


def test_serpapi_no_results_is_empty_but_bad_key_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    provider = providers.SerpApiGoogleJobsProvider(api_key="k", max_pages=1, timeout=5)

    _mock_http(
        monkeypatch,
        lambda _: httpx.Response(
            200, json={"error": "Google hasn't returned any results for this query."}
        ),
    )
    assert _search(provider) == []

    _mock_http(
        monkeypatch,
        lambda _: httpx.Response(200, json={"error": "Invalid API key."}),
    )
    with pytest.raises(RuntimeError, match="Invalid API key"):
        _search(provider)
