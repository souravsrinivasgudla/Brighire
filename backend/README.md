# Brighire Backend

Backend service for the Brighire platform.

## Tech Stack

- Python 3.12
- FastAPI
- uv
- PostgreSQL
- SQLAlchemy
- Redis

## Status

🚧 Under Development
## Job portal MCP server

Profile-based job recommendations come from a bundled MCP server,
`brighire-job-portals` (`src/app/job_portals/mcp_server.py`). It exposes one
normalized `search_jobs` tool backed by:

| Source             | What it covers                                    | Setup                                        |
|--------------------|---------------------------------------------------|----------------------------------------------|
| Company boards     | Greenhouse / Lever / Ashby career pages, full JDs | **Free, no key, on by default**              |
| Himalayas          | Remote jobs open to your country                  | **Free, no key, on by default**              |
| Remote OK          | Remote jobs (worldwide or your country)           | **Free, no key, on by default**              |
| SerpApi Google Jobs| Google Jobs (LinkedIn, Naukri, Indeed, …)         | Key from serpapi.com; 1 search per page      |
| Adzuna             | Aggregated listings, 12+ countries incl. India    | Free key: https://developer.adzuna.com       |
| JSearch            | LinkedIn, Indeed, Glassdoor via Google for Jobs   | RapidAPI key (free tier ~200 req/month)      |
| Jooble             | 60+ countries incl. India (snippets only)         | Free key on request: https://jooble.org/api/about |
| JobSpy             | Direct scraping (Indeed, LinkedIn, Naukri, …)     | `uv sync --extra jobspy`; opt-in             |

Keyed sources are enabled once their key is set. Add to `backend/.env`:

```env
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
JSEARCH_API_KEY=...
SERPAPI_API_KEY=...
SERPAPI_MAX_PAGES=1            # 10 results per page; each page = 1 SerpApi search
JOOBLE_API_KEY=...
JOB_PORTAL_COUNTRY=in          # default country (two-letter code)

# Free company career boards: ats:board-slug=Display Name, comma-separated.
# The slug is the company name in its careers URL, e.g.
# job-boards.greenhouse.io/<slug>, jobs.lever.co/<slug>, jobs.ashbyhq.com/<slug>
COMPANY_BOARDS=greenhouse:gitlab=GitLab,lever:meesho=Meesho,ashby:notion=Notion
HIMALAYAS_ENABLED=true
REMOTEOK_ENABLED=true

# JobSpy scrapes portals directly: fragile and may breach their terms of
# service. Keep it off in production.
JOBSPY_ENABLED=false
JOBSPY_SITES=indeed,linkedin,naukri,google

# Optional: use an already-running server instead of spawning one per request
# JOB_PORTAL_MCP_URL=http://127.0.0.1:8765/mcp
```

`POST /api/v1/jobs/discover` asks Groq for 1-3 search titles from the user's
primary resume, calls `search_jobs` over MCP, skips jobs already saved, imports
the rest, and AI-scores the top 10. Rate limited to 5 runs per 10 minutes.

Run the server on its own:

```bash
uv run python -m app.job_portals.mcp_server                    # stdio
uv run python -m app.job_portals.mcp_server --http --port 8765 # Streamable HTTP
```

The repo-root `.mcp.json` also registers it for Claude Code.

Apply the migration after pulling: `uv run alembic upgrade head`.
