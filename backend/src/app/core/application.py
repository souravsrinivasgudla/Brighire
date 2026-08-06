"""Application factory."""

from fastapi import FastAPI

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.api.root import router as root_router

def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="AI-powered Resume Analyzer, Job Matching and Career Platform",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        debug=settings.debug,
    )


    app.include_router(api_router, prefix="/api/v1")
    app.include_router(root_router)

    return app