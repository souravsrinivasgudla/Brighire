"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Return application health status."""
    return {
        "status": "healthy",
        "application": "Brighire",
        "version": "0.1.0",
    }

