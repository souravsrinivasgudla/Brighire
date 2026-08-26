"""Production configuration security tests."""

import pytest
from fastapi.middleware.cors import CORSMiddleware
from starlette.testclient import TestClient

from app.core import application as application_module
from app.core.config import settings


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


def test_production_forces_debug_false(
    production_settings: None,
) -> None:
    """Even if DEBUG=true, production must run with debug disabled."""

    app = application_module.create_application()

    assert settings.app_env.lower() == "production"
    assert app.debug is False


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
