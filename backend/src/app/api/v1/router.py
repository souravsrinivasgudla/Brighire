"""API v1 router."""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.root import router as root_router
from app.users.router import router as users_router
from app.auth.router import router as auth_router
from app.resumes.router import router as resumes_router
from app.jobs.router import router as jobs_router
from app.jobs.match_router import router as match_router
from app.dashboard.router import router as dashboard_router

router = APIRouter()

router.include_router(root_router)
router.include_router(health_router)
router.include_router(users_router)
router.include_router(auth_router)
router.include_router(resumes_router)
router.include_router(jobs_router)
router.include_router(match_router)
router.include_router(dashboard_router)