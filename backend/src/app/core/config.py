from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    app_name: str = "Brighire"
    app_version: str = "0.1.0"
    app_env: str = "development"

    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = False

    max_resume_size_mb: int = 10

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    redis_url: str = "redis://localhost:6379/0"
    redis_socket_connect_timeout: float = 2.0
    redis_socket_timeout: float = 2.0

    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 30
    algorithm: str = "HS256"

    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    groq_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


# Values come from environment / .env at runtime; pyright cannot see that.
settings = Settings()  # pyright: ignore[reportCallIssue]

