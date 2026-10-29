"""Shared pytest fixtures for Brighire security tests."""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path
from typing import Any, Self
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

import app.applications.models
import app.jobs.match_models
import app.jobs.models
import app.resumes.analysis_models
import app.resumes.models
import app.users.models
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.jobs.models import Job
from app.main import app
from app.resumes.models import Resume
from app.users.models import User


class FakeRedisPipeline:
    """Minimal Redis pipeline stand-in for rate-limit tests."""

    def __init__(self, redis: FakeRedis) -> None:
        self._redis = redis
        self._operations: list[tuple[Any, ...]] = []

    def __enter__(self) -> Self:
        self._redis._raise_if_unavailable()
        return self

    def __exit__(self, *_: object) -> None:
        return None

    def incr(self, key: str) -> Self:
        self._operations.append(("incr", key))
        return self

    def expire(self, key: str, seconds: int) -> Self:
        self._operations.append(("expire", key, seconds))
        return self

    def execute(self) -> list[Any]:
        self._redis._raise_if_unavailable()

        results: list[Any] = []

        for operation in self._operations:
            if operation[0] == "incr":
                results.append(self._redis.incr(operation[1]))
            elif operation[0] == "expire":
                results.append(
                    self._redis.expire(operation[1], operation[2])
                )

        self._operations.clear()
        return results


class FakeRedis:
    """In-memory Redis stand-in for deterministic rate-limit tests."""

    def __init__(self) -> None:
        self.counts: dict[str, int] = {}
        self.ttls: dict[str, int] = {}
        self.unavailable: bool = False

    def _raise_if_unavailable(self) -> None:
        if self.unavailable:
            from redis.exceptions import RedisError

            raise RedisError("Redis is unavailable")

    def incr(self, key: str) -> int:
        self._raise_if_unavailable()
        self.counts[key] = self.counts.get(key, 0) + 1
        return self.counts[key]

    def expire(self, key: str, seconds: int) -> bool:
        self._raise_if_unavailable()
        self.ttls[key] = seconds
        return True

    def pipeline(self, transaction: bool = True) -> FakeRedisPipeline:
        self._raise_if_unavailable()
        return FakeRedisPipeline(self)

    def reset(self) -> None:
        self.counts.clear()
        self.ttls.clear()
        self.unavailable = False


@pytest.fixture()
def fake_redis(monkeypatch: pytest.MonkeyPatch) -> FakeRedis:
    """Replace the module-level Redis client with an in-memory fake."""

    redis = FakeRedis()
    monkeypatch.setattr(
        "app.core.rate_limit.redis_client",
        redis,
    )
    return redis


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    """Provide an isolated in-memory SQLite database session."""

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_fk(dbapi_connection: Any, _: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        bind=engine,
        class_=Session,
        autoflush=False,
        autocommit=False,
    )
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(
    db_session: Session,
    fake_redis: FakeRedis,
) -> Generator[TestClient, None, None]:
    """HTTP client wired to the test database and fake Redis."""

    def _override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    fake_redis.reset()


@pytest.fixture()
def storage_dir(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> Path:
    """Point resume storage at a temporary directory."""

    directory = tmp_path / "resumes"
    directory.mkdir()
    monkeypatch.setattr(
        "app.resumes.router.STORAGE_DIRECTORY",
        directory,
    )
    return directory


def create_user(
    db: Session,
    *,
    email: str | None = None,
    password: str = "password123",
    full_name: str = "Test User",
    is_active: bool = True,
) -> User:
    """Insert a user directly into the test database."""

    user = User(
        email=email or f"user-{uuid4()}@example.com",
        full_name=full_name,
        hashed_password=hash_password(password),
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(user: User) -> dict[str, str]:
    """Build an Authorization header for the given user."""

    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


def create_resume(
    db: Session,
    *,
    user: User,
    filename: str = "resume.pdf",
    extracted_text: str | None = "Python FastAPI engineer",
    storage_path: str = "storage/resumes/test.pdf",
    is_primary: bool | None = None,
) -> Resume:
    """Insert a resume owned by the given user."""

    if is_primary is None:
        has_primary = db.scalar(
            select(Resume.id).where(
                Resume.user_id == user.id,
                Resume.is_primary.is_(True),
            )
        )
        is_primary = has_primary is None

    resume = Resume(
        user_id=user.id,
        filename=filename,
        storage_path=storage_path,
        extracted_text=extracted_text,
        is_primary=is_primary,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def create_job(
    db: Session,
    *,
    user: User,
    title: str = "Backend Engineer",
    company: str = "Acme",
    description: str = "Build APIs",
    requirements: str | None = "Python",
    location: str | None = "Remote",
) -> Job:
    """Insert a job owned by the given user."""

    job = Job(
        user_id=user.id,
        title=title,
        company=company,
        description=description,
        requirements=requirements,
        location=location,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job
