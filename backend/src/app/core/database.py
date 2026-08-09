"""Database configuration and session management."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    autocommit=False,
)


def get_db() -> Generator[Session, None, None]:
    """Provide a database session for a request."""

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()