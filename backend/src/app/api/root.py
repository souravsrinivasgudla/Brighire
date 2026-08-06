from fastapi import APIRouter

router = APIRouter(tags=["Root"])

@router.get("/")
async def root():
    return {
        "message": "Welcome to Brighire API",
        "docs": "/docs",
        "health": "/api/v1/health",
        "version": "0.1.0",
    }