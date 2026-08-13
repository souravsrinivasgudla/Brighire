"""API v1 router."""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.root import router as root_router
from app.users.router import router as users_router
from app.auth.router import router as auth_router

router = APIRouter()

router.include_router(root_router)
router.include_router(health_router)
router.include_router(users_router)
router.include_router(auth_router)