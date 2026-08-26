"""Production configuration security tests."""

from typing import Any

import pytest
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from starlette.testclient import TestClient

from app.core import application as application_module
from app.core import database as database_module
from app.core.config import Settings, settings

_SETTINGS_REQUIRED: dict[str, Any] = {
    "database_url": "sqlite://",
    "secret_key": "test-secret",
    "groq_api_key": "test-key",
}


def _settings_from_env() -> Settings:
    """Build Settings from process env only (skip project .env)."""

    # `_env_file` is a pydantic-settings constructor option; the generated
    # Settings.__init__ stub only lists model fields, so pass it via **kwargs.
    return Settings(**{**_SETTINGS_REQUIRED, "_env_file": None})


@pytest.fixture()
def production_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    """Force production-like settings for application factory tests."""

    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "debug", True)
    monkeypatch.setattr(
        settings,
        "cors_origins",
        "https://app.example.com,https://admin.example.com",
    )


def test_debug_defaults_to_false(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Missing DEBUG must default to False for production safety."""

    monkeypatch.delenv("DEBUG", raising=False)

    cfg = _settings_from_env()

    assert cfg.debug is False


def test_debug_env_false(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """DEBUG=false must parse as False."""

    monkeypatch.setenv("DEBUG", "false")

    cfg = _settings_from_env()

    assert cfg.debug is False


def test_debug_env_true(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """DEBUG=true must remain available for local development."""

    monkeypatch.setenv("DEBUG", "true")

    cfg = _settings_from_env()

    assert cfg.debug is True


def test_production_forces_debug_false(
    production_settings: None,
) -> None:
    """Even if DEBUG=true, production must run with debug disabled."""

    app = application_module.create_application()

    assert settings.app_env.lower() == "production"
    assert app.debug is False


def test_database_echo_disabled_when_debug_false(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """SQL echo must be off when debug is False (production default)."""

    monkeypatch.setattr(settings, "debug", False)

    # Mirrors app.core.database engine creation.
    engine = create_engine(
        "sqlite://",
        echo=settings.debug,
    )

    assert engine.echo is False


def test_database_echo_enabled_when_debug_true(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """SQL echo may be on only when debug mode is explicitly enabled."""

    monkeypatch.setattr(settings, "debug", True)

    # Mirrors app.core.database engine creation.
    engine = create_engine(
        "sqlite://",
        echo=settings.debug,
    )

    assert bool(engine.echo) is True


def test_database_module_echo_follows_settings_debug() -> None:
    """The app engine must wire echo to settings.debug, not always-on."""

    assert bool(database_module.engine.echo) is bool(settings.debug)


def test_docs_disabled_outside_development(
    production_settings: None,
) -> None:
    """OpenAPI UIs must be unavailable outside development."""

    app = application_module.create_application()
    client = TestClient(app)

    assert app.docs_url is None
    assert app.redoc_url is None
    assert app.openapi_url is None
    assert client.get("/docs").status_code == 404
    assert client.get("/redoc").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_cors_only_permits_configured_origins(
    production_settings: None,
) -> None:
    """CORS middleware must allow only explicitly configured origins."""

    app = application_module.create_application()
    cors_middleware = None

    for middleware in app.user_middleware:
        if middleware.cls is CORSMiddleware:
            cors_middleware = middleware
            break

    assert cors_middleware is not None

    allowed_origins = cors_middleware.kwargs["allow_origins"]
    assert allowed_origins == [
        "https://app.example.com",
        "https://admin.example.com",
    ]

    client = TestClient(app)

    allowed = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://app.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert allowed.headers.get("access-control-allow-origin") == (
        "https://app.example.com"
    )

    denied = client.options(
        "/api/v1/health",
        headers={
            "Origin": "https://evil.example.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert denied.headers.get("access-control-allow-origin") is None
