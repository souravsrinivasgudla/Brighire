from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    app_name: str = "Brighire"
    app_version: str = "0.1.0"
    app_env: str = "development"

    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = True

    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Values come from environment / .env at runtime; pyright cannot see that.
settings = Settings()  # pyright: ignore[reportCallIssue]

