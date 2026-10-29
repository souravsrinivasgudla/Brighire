"""BrightHire job portal MCP server.

Exposes Adzuna, JSearch, SerpApi Google Jobs, Jooble, Greenhouse/Lever/Ashby career boards,
Himalayas, RemoteOK, and JobSpy behind one normalized ``search_jobs``
tool. The backend talks to it as an MCP client; it can also be registered in
Claude Desktop / Claude Code.

Run over stdio:            python -m app.job_portals.mcp_server
Run over Streamable HTTP:  python -m app.job_portals.mcp_server --http --port 8765
"""

import argparse
import logging
import sys

from mcp.server.mcpserver import MCPServer

from app.job_portals.config import job_portal_settings
from app.job_portals.providers import build_providers, search_all
from app.job_portals.schemas import JobSearchResult

server = MCPServer(
    name="brighire-job-portals",
    instructions=(
        "Search live job listings from configured job portals and company "
        "career boards. Call search_jobs with a role or skill query."
    ),
)


@server.tool()
async def search_jobs(
    query: str,
    location: str | None = None,
    country: str | None = None,
    limit: int = 20,
    sources: list[str] | None = None,
) -> JobSearchResult:
    """Search job portals for listings.

    Args:
        query: Role, title, or skills to search for, e.g. "python backend engineer".
        location: City or region, e.g. "Bengaluru". Optional.
        country: Two-letter country code, e.g. "in" or "us". Defaults to the server setting.
        limit: Maximum listings to return per source (1-50).
        sources: Restrict to these sources ("adzuna", "jsearch", "google_jobs", "jooble", "company_boards",
            "himalayas", "remoteok", "jobspy"). Defaults to all configured.
    """

    providers = build_providers(job_portal_settings)

    if sources:
        wanted = {source.lower() for source in sources}
        providers = [p for p in providers if p.name in wanted]

    if not providers:
        return JobSearchResult(
            jobs=[],
            errors=["No job portal sources are configured."],
        )

    jobs, errors = await search_all(
        providers,
        query=query,
        location=location,
        country=country or job_portal_settings.job_portal_country,
        limit=max(1, min(limit, 50)),
    )

    return JobSearchResult(jobs=jobs, errors=errors)


@server.tool()
def list_job_sources() -> list[str]:
    """List the job portal sources that are configured and enabled."""

    return [provider.name for provider in build_providers(job_portal_settings)]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--http", action="store_true", help="Serve Streamable HTTP instead of stdio.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    # stdout carries the MCP protocol over stdio; logs must go to stderr.
    logging.basicConfig(stream=sys.stderr, level=logging.INFO)
    # httpx logs full request URLs, and Adzuna/SerpApi carry API keys in them.
    logging.getLogger("httpx").setLevel(logging.WARNING)

    if args.http:
        server.run("streamable-http", host=args.host, port=args.port)
    else:
        server.run()


if __name__ == "__main__":
    main()
