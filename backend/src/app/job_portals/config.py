"""Job portal settings.

Kept separate from ``app.core.config`` so the MCP server can run on its own
(for example from Claude Desktop) without database, JWT, or Groq secrets.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class JobPortalSettings(BaseSettings):
    # Adzuna: free keys from https://developer.adzuna.com
    adzuna_app_id: str | None = None
    adzuna_app_key: str | None = None

    # JSearch on RapidAPI (LinkedIn / Indeed / Glassdoor via Google for Jobs)
    jsearch_api_key: str | None = None

    # SerpApi Google Jobs: https://serpapi.com/google-jobs-api
    # Each page (10 results) costs one search from the monthly quota.
    serpapi_api_key: str | None = None
    serpapi_max_pages: int = 1

    # Jooble: free key requested at https://jooble.org/api/about
    jooble_api_key: str | None = None

    # Free company career boards (no key). Comma-separated
    # ``ats:board[=Display Name]`` where ats is greenhouse, lever, or ashby.
    # The board name is the slug in the company's careers URL.
    company_boards: str = (
        "greenhouse:razorpaysoftwareprivatelimited=Razorpay,"
        "greenhouse:groww=Groww,"
        "greenhouse:databricks=Databricks,"
        "greenhouse:cloudflare=Cloudflare,"
        "greenhouse:gitlab=GitLab,"
        "greenhouse:mongodb=MongoDB,"
        "lever:cred=CRED,"
        "lever:meesho=Meesho,"
        "lever:zeta=Zeta,"
        "ashby:openai=OpenAI,"
        "ashby:sarvam=Sarvam AI,"
        "ashby:notion=Notion,"
        "ashby:ramp=Ramp"
    )

    # Free remote-job boards (no key). Results are limited to jobs open to
    # the search country.
    himalayas_enabled: bool = True
    remoteok_enabled: bool = True

    # JobSpy scrapes portals directly. Off by default: fragile and may breach
    # the portals' terms of service. Requires the ``jobspy`` extra.
    jobspy_enabled: bool = False
    jobspy_sites: str = "indeed,linkedin,naukri,google"

    # Two-letter country code used when a search does not specify one.
    job_portal_country: str = "in"
    job_portal_timeout_seconds: float = 20.0

    # Connect the backend to an already-running MCP server over Streamable
    # HTTP. When empty, the backend spawns the bundled server over stdio.
    job_portal_mcp_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


job_portal_settings = JobPortalSettings()
