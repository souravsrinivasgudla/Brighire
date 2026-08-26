"""Application factory."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.root import router as root_router
from app.api.v1.router import router as api_router
from app.core.config import settings
from app.core.logging import configure_logging


def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    configure_logging()

    is_development = settings.app_env.lower() == "development"

    allowed_origins = [
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
    ]

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "AI-powered Resume Analyzer, Job Matching "
            "and Career Platform"
        ),
        docs_url="/docs" if is_development else None,
        redoc_url="/redoc" if is_development else None,
        openapi_url="/openapi.json" if is_development else None,
        debug=settings.debug if is_development else False,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(
        api_router,
        prefix="/api/v1",
    )

    app.include_router(root_router)

    return app