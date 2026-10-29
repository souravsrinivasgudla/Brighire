"""MCP client the backend uses to reach the job portal server."""

import logging
import os
import sys
from pathlib import Path
from typing import Any

import anyio
from mcp import Client
from mcp.client.stdio import StdioServerParameters
from pydantic import ValidationError

from app.job_portals.config import job_portal_settings
from app.job_portals.schemas import JobSearchResult, PortalJob
from app.shared.exceptions import JobPortalUnavailableError

logger = logging.getLogger(__name__)

_SRC_DIR = Path(__file__).resolve().parents[2]
_FORWARDED_ENV_PREFIXES = ("ADZUNA_", "JSEARCH_", "JOBSPY_", "JOB_PORTAL_")
_UNAVAILABLE = "Job portal service is temporarily unavailable."


def _default_server() -> StdioServerParameters | str:
    """Use the configured HTTP server, or spawn the bundled one over stdio."""

    if job_portal_settings.job_portal_mcp_url:
        return job_portal_settings.job_portal_mcp_url

    # The stdio transport starts from a minimal environment, so forward the
    # portal credentials explicitly (they may come from the real environment
    # rather than .env in production).
    env = {
        key: value
        for key, value in os.environ.items()
        if key.upper().startswith(_FORWARDED_ENV_PREFIXES)
    }
    env["PYTHONPATH"] = str(_SRC_DIR)

    return StdioServerParameters(
        command=sys.executable,
        args=["-m", "app.job_portals.mcp_server"],
        env=env,
        cwd=str(_SRC_DIR),
    )


class JobPortalMCPClient:
    """Synchronous facade over the async MCP client."""

    def __init__(self, server: Any | None = None) -> None:
        # ``server`` accepts anything ``mcp.Client`` does; tests pass an
        # in-process MCPServer.
        self.server = server if server is not None else _default_server()

    def search(
        self,
        *,
        queries: list[str],
        location: str | None,
        country: str | None,
        limit: int,
    ) -> JobSearchResult:
        """Run ``search_jobs`` for each query over a single MCP session."""

        try:
            return anyio.run(
                self._search,
                queries,
                location,
                country,
                limit,
            )
        except JobPortalUnavailableError:
            raise
        except Exception as exc:  # noqa: BLE001 - any transport failure means unavailable
            logger.warning(
                "Job portal MCP call failed: %s: %s",
                type(exc).__name__,
                exc,
            )
            raise JobPortalUnavailableError(_UNAVAILABLE) from None

    async def _search(
        self,
        queries: list[str],
        location: str | None,
        country: str | None,
        limit: int,
    ) -> JobSearchResult:
        jobs: list[PortalJob] = []
        errors: list[str] = []
        timeout = job_portal_settings.job_portal_timeout_seconds + 30

        async with Client(self.server, read_timeout_seconds=timeout) as client:
            for query in queries:
                arguments: dict[str, Any] = {"query": query, "limit": limit}

                if location:
                    arguments["location"] = location

                if country:
                    arguments["country"] = country

                result = await client.call_tool("search_jobs", arguments)

                if result.is_error:
                    errors.append(f"search_jobs failed for '{query}'")
                    continue

                try:
                    parsed = JobSearchResult.model_validate(
                        result.structured_content
                    )
                except ValidationError:
                    logger.error("search_jobs returned an unexpected payload.")
                    errors.append(f"unreadable results for '{query}'")
                    continue

                jobs.extend(parsed.jobs)
                errors.extend(e for e in parsed.errors if e not in errors)

        return JobSearchResult(jobs=jobs, errors=errors)
