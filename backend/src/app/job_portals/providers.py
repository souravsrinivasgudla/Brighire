"""Job portal providers that normalize listings into ``PortalJob``."""

import hashlib
import html
import logging
import math
import re
import time
from datetime import UTC, datetime
from typing import Any, Protocol

import anyio
import httpx

from app.job_portals.config import JobPortalSettings
from app.job_portals.schemas import PortalJob

logger = logging.getLogger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")
_BLOCK_TAG_RE = re.compile(r"</?(p|div|br|li|h[1-6]|ul|ol)[^>]*>", re.IGNORECASE)
_WHITESPACE_RE = re.compile(r"[ \t]+")
_BLANK_LINES_RE = re.compile(r"\n\s*\n+")
_TOKEN_RE = re.compile(r"[a-z0-9+#.]+")

# Long postings are cut so stored jobs and AI prompts stay a sane size.
_MAX_DESCRIPTION = 8000

# Display names used to match free-text locations, keyed by ISO code.
_COUNTRY_NAMES = {
    "in": "India",
    "us": "United States",
    "gb": "United Kingdom",
    "ca": "Canada",
    "au": "Australia",
    "de": "Germany",
    "fr": "France",
    "sg": "Singapore",
    "ae": "United Arab Emirates",
    "nl": "Netherlands",
}

# Alternative spellings that appear in job locations.
_LOCATION_ALIASES = {
    "bengaluru": ["bangalore"],
    "bangalore": ["bengaluru"],
    "gurugram": ["gurgaon"],
    "gurgaon": ["gurugram"],
    "mumbai": ["bombay"],
    "chennai": ["madras"],
    "united states": ["usa", "us"],
    "united kingdom": ["uk"],
}

# Words that say nothing about the role itself when ranking titles.
_GENERIC_WORDS = {
    "senior", "junior", "lead", "staff", "principal", "sr", "jr", "mid",
    "level", "the", "and", "of", "for", "in", "with", "i", "ii", "iii",
}

# Role nouns shared by unrelated jobs ("Security Engineer" vs "Data Engineer").
_ROLE_WORDS = {
    "engineer", "engineering", "developer", "development", "manager",
    "specialist", "analyst", "architect", "consultant", "designer",
    "scientist", "intern", "associate", "sde", "software",
}

# Location words that do not restrict where the job can be done from.
_OPEN_LOCATION_WORDS = {
    "remote", "worldwide", "anywhere", "global", "globally", "fully", "first",
}

# Company boards and RemoteOK return the whole board on every call, so one
# discovery run (several queries) should fetch each board only once.
_CACHE_TTL_SECONDS = 600
_json_cache: dict[str, tuple[float, Any]] = {}

# JobSpy expects Indeed country names rather than ISO codes.
_JOBSPY_COUNTRIES = {
    "in": "india",
    "us": "usa",
    "gb": "uk",
    "ca": "canada",
    "au": "australia",
    "de": "germany",
    "fr": "france",
    "sg": "singapore",
    "ae": "united arab emirates",
    "nl": "netherlands",
}


class JobProvider(Protocol):
    name: str

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]: ...


def _clean(text: Any) -> str:
    """Strip HTML tags and entities from portal text, keeping paragraphs."""

    if text is None:
        return ""

    # Greenhouse double-escapes its HTML ("&lt;p&gt;"), so unescape first.
    value = html.unescape(str(text))
    value = _BLOCK_TAG_RE.sub("\n", value)
    value = html.unescape(_TAG_RE.sub("", value))
    value = _WHITESPACE_RE.sub(" ", value)

    return _BLANK_LINES_RE.sub("\n\n", value).strip()[:_MAX_DESCRIPTION]


def _tokens(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _title_relevance(query: str, title: str) -> float:
    """Share of the query's meaningful words that appear in the title.

    When the query names a field ("data", "backend"), at least one of those
    words must appear: matching only "Engineer" is not a match.
    """

    words = [w for w in _tokens(query) if w not in _GENERIC_WORDS] or _tokens(query)

    if not words:
        return 1.0

    title_words = set(_tokens(title))
    field_words = [w for w in words if w not in _ROLE_WORDS]

    if field_words and not any(word in title_words for word in field_words):
        return 0.0

    return sum(word in title_words for word in words) / len(words)


def _location_terms(location: str | None, country: str) -> list[str]:
    terms: list[str] = []

    if location:
        city = location.split(",")[0].strip().lower()
        if city:
            terms.append(city)
            terms.extend(_LOCATION_ALIASES.get(city, []))

    country_name = _COUNTRY_NAMES.get(country.lower())

    if country_name:
        terms.append(country_name.lower())
        terms.extend(_LOCATION_ALIASES.get(country_name.lower(), []))

    return terms


def _location_matches(
    job_location: str,
    *,
    location: str | None,
    country: str,
    is_remote: bool | None,
) -> bool:
    """Keep jobs in the user's city or country, or remote with no other place."""

    text = job_location.lower()
    terms = _location_terms(location, country)

    if not text or not terms:
        return True

    text_words = set(_tokens(text))

    # Short codes ("us", "uk") must match whole words, not substrings.
    if any(
        term in text_words if len(term) <= 3 else term in text
        for term in terms
    ):
        return True

    # "Remote" alone is open to anyone, but "Remote - US" or a hybrid office
    # job flagged remote ("San Francisco, New York") is not.
    if is_remote or "remote" in text:
        return not (text_words - _OPEN_LOCATION_WORDS)

    return False


def _rank(
    listings: list[tuple[PortalJob, str]],
    *,
    query: str,
    location: str | None,
    country: str,
    limit: int,
) -> list[PortalJob]:
    """Filter board listings by query and location, best title match first."""

    scored: list[tuple[float, PortalJob]] = []

    for job, job_location in listings:
        relevance = _title_relevance(query, job.title)

        if relevance < 0.5:
            continue

        if not _location_matches(
            job_location,
            location=location,
            country=country,
            is_remote=job.is_remote,
        ):
            continue

        scored.append((relevance, job))

    scored.sort(key=lambda item: item[0], reverse=True)

    # Cap each company so one large board cannot fill the whole result.
    per_company = max(2, math.ceil(limit / 3))
    counts: dict[str, int] = {}
    picked: list[PortalJob] = []
    overflow: list[PortalJob] = []

    for _, job in scored:
        key = job.company.lower()
        counts[key] = counts.get(key, 0) + 1
        (picked if counts[key] <= per_company else overflow).append(job)

    # Fall back to capped-out jobs only when few companies matched.
    return (picked + overflow)[:limit]


async def _get_json(
    url: str,
    *,
    timeout: float,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
) -> Any:
    """GET a JSON document, cached briefly per URL and params."""

    key = f"{url}?{sorted((params or {}).items())}"
    cached = _json_cache.get(key)

    if cached and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        response = await client.get(url, params=params, headers=headers)
        response.raise_for_status()

    data = response.json()
    _json_cache[key] = (time.monotonic(), data)

    return data


def _epoch_to_iso(value: Any, *, millis: bool = False) -> str | None:
    number = _number(value)

    if number is None:
        return None

    return datetime.fromtimestamp(number / 1000 if millis else number, UTC).isoformat()


def _text(value: Any) -> str | None:
    """Return a non-empty string, or None for missing / NaN values."""

    return value if isinstance(value, str) and value else None


def _number(value: Any) -> float | None:
    """Return a finite float, or None for missing / NaN values."""

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    return number if math.isfinite(number) else None


class AdzunaProvider:
    """Adzuna job search API."""

    name = "adzuna"
    base_url = "https://api.adzuna.com/v1/api/jobs"

    def __init__(self, *, app_id: str, app_key: str, timeout: float) -> None:
        self.app_id = app_id
        self.app_key = app_key
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        params: dict[str, Any] = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": query,
            "results_per_page": min(limit, 50),
        }

        if location:
            params["where"] = location

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"{self.base_url}/{country.lower()}/search/1",
                params=params,
                headers={"Accept": "application/json"},
            )
            response.raise_for_status()

        jobs: list[PortalJob] = []

        for item in response.json().get("results", []):
            title = _clean(item.get("title"))

            if not item.get("id") or not title:
                continue

            jobs.append(
                PortalJob(
                    source=self.name,
                    external_id=str(item["id"]),
                    title=title,
                    company=_clean((item.get("company") or {}).get("display_name"))
                    or "Unknown company",
                    location=_clean((item.get("location") or {}).get("display_name"))
                    or None,
                    description=_clean(item.get("description")) or title,
                    url=item.get("redirect_url"),
                    salary_min=_number(item.get("salary_min")),
                    salary_max=_number(item.get("salary_max")),
                    posted_at=item.get("created"),
                )
            )

        return jobs


class JSearchProvider:
    """JSearch on RapidAPI (aggregates LinkedIn, Indeed, Glassdoor, ...)."""

    name = "jsearch"
    host = "jsearch.p.rapidapi.com"

    def __init__(self, *, api_key: str, timeout: float) -> None:
        self.api_key = api_key
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        params = {
            "query": f"{query} in {location}" if location else query,
            "page": "1",
            # JSearch returns ~10 results per page.
            "num_pages": str(max(1, min(3, math.ceil(limit / 10)))),
            "country": country.lower(),
            "date_posted": "month",
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.get(
                f"https://{self.host}/search",
                params=params,
                headers={
                    "x-rapidapi-key": self.api_key,
                    "x-rapidapi-host": self.host,
                },
            )
            response.raise_for_status()

        jobs: list[PortalJob] = []

        for item in response.json().get("data", [])[:limit]:
            title = _clean(item.get("job_title"))

            if not item.get("job_id") or not title:
                continue

            location_text = item.get("job_location") or ", ".join(
                part
                for part in (
                    item.get("job_city"),
                    item.get("job_state"),
                    item.get("job_country"),
                )
                if part
            )

            jobs.append(
                PortalJob(
                    source=self.name,
                    external_id=str(item["job_id"]),
                    title=title,
                    company=_clean(item.get("employer_name")) or "Unknown company",
                    location=location_text or None,
                    description=_clean(item.get("job_description")) or title,
                    url=item.get("job_apply_link") or item.get("job_google_link"),
                    salary_min=_number(item.get("job_min_salary")),
                    salary_max=_number(item.get("job_max_salary")),
                    is_remote=item.get("job_is_remote"),
                    posted_at=item.get("job_posted_at_datetime_utc"),
                )
            )

        return jobs


class JobSpyProvider:
    """Direct portal scraping through the python-jobspy library."""

    name = "jobspy"

    def __init__(self, *, sites: list[str]) -> None:
        self.sites = sites

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        # JobSpy is synchronous and network-bound; keep it off the event loop.
        return await anyio.to_thread.run_sync(
            lambda: self._search_sync(
                query=query,
                location=location,
                country=country,
                limit=limit,
            )
        )

    def _search_sync(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        from jobspy import scrape_jobs

        frame = scrape_jobs(
            site_name=self.sites,
            search_term=query,
            google_search_term=f"{query} jobs near {location}" if location else f"{query} jobs",
            location=location,
            results_wanted=limit,
            hours_old=24 * 30,
            country_indeed=_JOBSPY_COUNTRIES.get(country.lower(), "usa"),
            verbose=0,
        )

        jobs: list[PortalJob] = []

        for item in frame.to_dict("records"):
            title = _clean(item.get("title"))
            job_id = item.get("id")

            if not title or not isinstance(job_id, str):
                continue

            posted = item.get("date_posted")
            remote = item.get("is_remote")

            jobs.append(
                PortalJob(
                    source=f"jobspy-{item.get('site') or 'unknown'}",
                    external_id=job_id,
                    title=title,
                    company=_clean(_text(item.get("company"))) or "Unknown company",
                    location=_text(item.get("location")),
                    description=_clean(_text(item.get("description"))) or title,
                    url=_text(item.get("job_url")),
                    salary_min=_number(item.get("min_amount")),
                    salary_max=_number(item.get("max_amount")),
                    is_remote=remote if isinstance(remote, bool) else None,
                    posted_at=posted.isoformat() if hasattr(posted, "isoformat") else None,
                )
            )

        return jobs[:limit]


class CompanyBoardsProvider:
    """Public career-board APIs of Greenhouse, Lever, and Ashby (no key)."""

    name = "company_boards"

    def __init__(self, *, boards: list[tuple[str, str, str]], timeout: float) -> None:
        # (ats, board slug, company display name)
        self.boards = boards
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        listings: list[tuple[PortalJob, str]] = []

        async def load(ats: str, slug: str, company: str) -> None:
            try:
                listings.extend(await self._fetch_board(ats, slug, company))
            except Exception as exc:  # noqa: BLE001 - one closed board must not hide the rest
                logger.warning(
                    "Career board %s:%s failed: %s",
                    ats,
                    slug,
                    type(exc).__name__,
                )

        async with anyio.create_task_group() as group:
            for ats, slug, company in self.boards:
                group.start_soon(load, ats, slug, company)

        return _rank(
            listings,
            query=query,
            location=location,
            country=country,
            limit=limit,
        )

    async def _fetch_board(
        self,
        ats: str,
        slug: str,
        company: str,
    ) -> list[tuple[PortalJob, str]]:
        if ats == "greenhouse":
            data = await _get_json(
                f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs",
                params={"content": "true"},
                timeout=self.timeout,
            )
            return [self._greenhouse(item, slug, company) for item in data.get("jobs", [])]

        if ats == "lever":
            data = await _get_json(
                f"https://api.lever.co/v0/postings/{slug}",
                params={"mode": "json"},
                timeout=self.timeout,
            )
            return [self._lever(item, slug, company) for item in data]

        if ats == "ashby":
            data = await _get_json(
                f"https://api.ashbyhq.com/posting-api/job-board/{slug}",
                timeout=self.timeout,
            )
            return [
                self._ashby(item, slug, company)
                for item in data.get("jobs", [])
                if item.get("isListed", True)
            ]

        raise ValueError(f"Unknown career board type: {ats}")

    @staticmethod
    def _greenhouse(item: dict, slug: str, company: str) -> tuple[PortalJob, str]:
        location = _clean((item.get("location") or {}).get("name"))
        title = _clean(item.get("title"))

        return (
            PortalJob(
                source="greenhouse",
                external_id=f"{slug}:{item['id']}",
                title=title,
                company=_clean(item.get("company_name")) or company,
                location=location or None,
                description=_clean(item.get("content")) or title,
                url=item.get("absolute_url"),
                is_remote="remote" in location.lower() or None,
                posted_at=item.get("first_published") or item.get("updated_at"),
            ),
            location,
        )

    @staticmethod
    def _lever(item: dict, slug: str, company: str) -> tuple[PortalJob, str]:
        categories = item.get("categories") or {}
        locations = categories.get("allLocations") or [categories.get("location")]
        location = ", ".join(str(loc) for loc in locations if loc)
        title = _clean(item.get("text"))

        sections = [item.get("descriptionPlain") or _clean(item.get("description"))]
        for section in item.get("lists") or []:
            sections.append(f"{section.get('text', '')}\n{_clean(section.get('content'))}")
        sections.append(item.get("additionalPlain") or "")

        return (
            PortalJob(
                source="lever",
                external_id=f"{slug}:{item['id']}",
                title=title,
                company=company,
                location=location or None,
                description=_clean("\n\n".join(s for s in sections if s)) or title,
                url=item.get("hostedUrl"),
                is_remote=item.get("workplaceType") == "remote" or None,
                posted_at=_epoch_to_iso(item.get("createdAt"), millis=True),
            ),
            location,
        )

    @staticmethod
    def _ashby(item: dict, slug: str, company: str) -> tuple[PortalJob, str]:
        locations = [item.get("location")] + [
            loc.get("location") for loc in item.get("secondaryLocations") or []
        ]
        location = ", ".join(str(loc) for loc in locations if loc)
        title = _clean(item.get("title"))

        return (
            PortalJob(
                source="ashby",
                external_id=f"{slug}:{item['id']}",
                title=title,
                company=company,
                location=location or None,
                description=_clean(item.get("descriptionPlain") or item.get("descriptionHtml"))
                or title,
                url=item.get("jobUrl"),
                # ``isRemote`` is also set on hybrid office jobs; trust workplaceType.
                is_remote=str(item.get("workplaceType", "")).lower() == "remote" or None,
                posted_at=item.get("publishedAt"),
            ),
            location,
        )


class HimalayasProvider:
    """Himalayas remote-job search API (no key)."""

    name = "himalayas"

    def __init__(self, *, timeout: float) -> None:
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        params: dict[str, Any] = {"q": query}
        country_name = _COUNTRY_NAMES.get(country.lower())

        # Limits results to jobs open to this country (or worldwide).
        if country_name:
            params["country"] = country_name

        data = await _get_json(
            "https://himalayas.app/jobs/api/search",
            params=params,
            timeout=self.timeout,
        )

        jobs: list[PortalJob] = []

        for item in data.get("jobs", [])[:limit]:
            title = _clean(item.get("title"))
            guid = item.get("guid") or item.get("applicationLink")

            if not title or not guid:
                continue

            restrictions = item.get("locationRestrictions") or []

            jobs.append(
                PortalJob(
                    source="himalayas",
                    external_id=str(guid),
                    title=title,
                    company=_clean(item.get("companyName")) or "Unknown company",
                    location=(
                        f"Remote ({', '.join(restrictions[:3])})"
                        if restrictions
                        else "Remote (worldwide)"
                    ),
                    description=_clean(item.get("description") or item.get("excerpt"))
                    or title,
                    url=item.get("applicationLink") or guid,
                    salary_min=_number(item.get("minSalary")),
                    salary_max=_number(item.get("maxSalary")),
                    is_remote=True,
                    posted_at=_epoch_to_iso(item.get("pubDate")),
                )
            )

        return jobs


class RemoteOKProvider:
    """RemoteOK public feed (no key; its terms require a link back to the post)."""

    name = "remoteok"

    def __init__(self, *, timeout: float) -> None:
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        data = await _get_json(
            "https://remoteok.com/api",
            headers={"User-Agent": "BrightHire job discovery"},
            timeout=self.timeout,
        )

        country_terms = _location_terms(None, country)
        scored: list[tuple[float, PortalJob]] = []

        # The first element is the feed's legal notice, not a job.
        for item in data:
            title = _clean(item.get("position"))

            if not item.get("id") or not title:
                continue

            scope = (item.get("location") or "").strip()
            scope_lower = scope.lower()
            open_to_country = (
                not scope
                or any(word in scope_lower for word in ("worldwide", "anywhere", "global"))
                or any(term in scope_lower for term in country_terms)
            )

            if not open_to_country:
                continue

            # Tags ("python", "devops") rescue terse titles like "Engineer".
            tags = " ".join(item.get("tags") or [])
            relevance = max(
                _title_relevance(query, title),
                _title_relevance(query, tags),
            )

            if relevance < 0.5:
                continue

            scored.append(
                (
                    relevance,
                    PortalJob(
                        source="remoteok",
                        external_id=str(item["id"]),
                        title=title,
                        company=_clean(item.get("company")) or "Unknown company",
                        location=f"Remote ({scope})" if scope else "Remote (worldwide)",
                        description=_clean(item.get("description")) or title,
                        url=item.get("url") or item.get("apply_url"),
                        # RemoteOK uses 0 for "not stated".
                        salary_min=_number(item.get("salary_min")) or None,
                        salary_max=_number(item.get("salary_max")) or None,
                        is_remote=True,
                        posted_at=item.get("date"),
                    ),
                )
            )

        scored.sort(key=lambda item: item[0], reverse=True)

        return [job for _, job in scored[:limit]]


class SerpApiGoogleJobsProvider:
    """Google Jobs results through SerpApi (LinkedIn, Naukri, Indeed, ...)."""

    name = "google_jobs"
    url = "https://serpapi.com/search.json"

    def __init__(self, *, api_key: str, max_pages: int, timeout: float) -> None:
        self.api_key = api_key
        self.max_pages = max(1, max_pages)
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        params: dict[str, Any] = {
            "engine": "google_jobs",
            # Google parses "role city" reliably; SerpApi's ``location``
            # parameter rejects place names it does not recognize.
            "q": f"{query} {location}" if location else query,
            "gl": country.lower(),
            "hl": "en",
            "api_key": self.api_key,
        }
        pages = min(self.max_pages, math.ceil(limit / 10))
        jobs: list[PortalJob] = []

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for _ in range(pages):
                response = await client.get(self.url, params=params)
                response.raise_for_status()
                data = response.json()

                if error := data.get("error"):
                    # An empty result is reported as an error; treat it as none.
                    if "hasn't returned any results" in error:
                        break
                    raise RuntimeError(f"SerpApi: {error}")

                jobs.extend(self._parse(item) for item in data.get("jobs_results", []))

                token = (data.get("serpapi_pagination") or {}).get("next_page_token")
                if not token or len(jobs) >= limit:
                    break
                params["next_page_token"] = token

        return [job for job in jobs if job is not None][:limit]

    @staticmethod
    def _parse(item: dict) -> PortalJob | None:
        title = _clean(item.get("title"))
        job_id = item.get("job_id")

        if not title or not job_id:
            return None

        extensions = item.get("detected_extensions") or {}
        sections = [_clean(item.get("description"))]

        for highlight in item.get("job_highlights") or []:
            lines = "\n".join(f"- {_clean(line)}" for line in highlight.get("items") or [])
            sections.append(f"{highlight.get('title', '')}\n{lines}".strip())

        apply_links = [
            option.get("link")
            for option in item.get("apply_options") or []
            if option.get("link")
        ]

        return PortalJob(
            source="google_jobs",
            # Google job ids are long base64 blobs; hash to fit the column.
            external_id=hashlib.sha256(str(job_id).encode()).hexdigest()[:40],
            title=title,
            company=_clean(item.get("company_name")) or "Unknown company",
            location=_clean(item.get("location")) or None,
            description=_clean("\n\n".join(s for s in sections if s)) or title,
            url=apply_links[0] if apply_links else item.get("share_link"),
            is_remote=extensions.get("work_from_home") or None,
            posted_at=extensions.get("posted_at"),
        )


class JoobleProvider:
    """Jooble job search API (free key on request)."""

    name = "jooble"

    def __init__(self, *, api_key: str, timeout: float) -> None:
        self.api_key = api_key
        self.timeout = timeout

    async def search(
        self,
        *,
        query: str,
        location: str | None,
        country: str,
        limit: int,
    ) -> list[PortalJob]:
        body = {
            "keywords": query,
            "location": location or _COUNTRY_NAMES.get(country.lower(), ""),
            "page": "1",
            "ResultOnPage": str(limit),
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"https://jooble.org/api/{self.api_key}",
                json=body,
            )
            response.raise_for_status()

        jobs: list[PortalJob] = []

        for item in response.json().get("jobs", [])[:limit]:
            title = _clean(item.get("title"))

            if not item.get("id") or not title:
                continue

            jobs.append(
                PortalJob(
                    source="jooble",
                    external_id=str(item["id"]),
                    title=title,
                    company=_clean(item.get("company")) or "Unknown company",
                    location=_clean(item.get("location")) or None,
                    # Jooble only returns a snippet of the description.
                    description=_clean(item.get("snippet")) or title,
                    url=item.get("link"),
                    is_remote="remote" in str(item.get("type", "")).lower() or None,
                    posted_at=item.get("updated"),
                )
            )

        return jobs


def parse_company_boards(value: str) -> list[tuple[str, str, str]]:
    """Parse ``ats:slug[=Name]`` entries; invalid entries are skipped."""

    boards: list[tuple[str, str, str]] = []

    for entry in value.split(","):
        entry = entry.strip()

        if not entry:
            continue

        ats, _, rest = entry.partition(":")
        slug, _, name = rest.partition("=")
        ats, slug = ats.strip().lower(), slug.strip()

        if ats not in {"greenhouse", "lever", "ashby"} or not slug:
            logger.warning("Ignoring invalid company board entry: %s", entry)
            continue

        boards.append((ats, slug, name.strip() or slug.replace("-", " ").title()))

    return boards


def build_providers(settings: JobPortalSettings) -> list[JobProvider]:
    """Create every provider that has credentials configured."""

    providers: list[JobProvider] = []
    timeout = settings.job_portal_timeout_seconds

    if settings.adzuna_app_id and settings.adzuna_app_key:
        providers.append(
            AdzunaProvider(
                app_id=settings.adzuna_app_id,
                app_key=settings.adzuna_app_key,
                timeout=timeout,
            )
        )

    if settings.jsearch_api_key:
        providers.append(
            JSearchProvider(
                api_key=settings.jsearch_api_key,
                timeout=timeout,
            )
        )

    if settings.serpapi_api_key:
        providers.append(
            SerpApiGoogleJobsProvider(
                api_key=settings.serpapi_api_key,
                max_pages=settings.serpapi_max_pages,
                timeout=timeout,
            )
        )

    if settings.jooble_api_key:
        providers.append(
            JoobleProvider(
                api_key=settings.jooble_api_key,
                timeout=timeout,
            )
        )

    boards = parse_company_boards(settings.company_boards)

    if boards:
        providers.append(
            CompanyBoardsProvider(
                boards=boards,
                timeout=timeout,
            )
        )

    if settings.himalayas_enabled:
        providers.append(HimalayasProvider(timeout=timeout))

    if settings.remoteok_enabled:
        providers.append(RemoteOKProvider(timeout=timeout))

    if settings.jobspy_enabled:
        providers.append(
            JobSpyProvider(
                sites=[
                    site.strip()
                    for site in settings.jobspy_sites.split(",")
                    if site.strip()
                ],
            )
        )

    return providers


async def search_all(
    providers: list[JobProvider],
    *,
    query: str,
    location: str | None,
    country: str,
    limit: int,
) -> tuple[list[PortalJob], list[str]]:
    """Query providers concurrently; collect results and per-source errors."""

    results: dict[str, list[PortalJob]] = {}
    errors: list[str] = []

    async def run(provider: JobProvider) -> None:
        try:
            results[provider.name] = await provider.search(
                query=query,
                location=location,
                country=country,
                limit=limit,
            )
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "Job portal %s returned HTTP %s.",
                provider.name,
                exc.response.status_code,
            )
            errors.append(
                f"{provider.name}: HTTP {exc.response.status_code}"
            )
        except Exception as exc:  # noqa: BLE001 - one broken portal must not sink the rest
            logger.warning(
                "Job portal %s failed: %s: %s",
                provider.name,
                type(exc).__name__,
                exc,
            )
            errors.append(f"{provider.name}: {type(exc).__name__}")

    async with anyio.create_task_group() as group:
        for provider in providers:
            group.start_soon(run, provider)

    # Interleave sources so a capped result list is not dominated by one portal.
    ordered = [results[p.name] for p in providers if p.name in results]
    jobs: list[PortalJob] = []

    for index in range(max((len(r) for r in ordered), default=0)):
        for source_jobs in ordered:
            if index < len(source_jobs):
                jobs.append(source_jobs[index])

    return jobs, errors
