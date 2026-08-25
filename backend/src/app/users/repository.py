"""User database operations."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.users.models import User


class UserRepository:
    """Repository for user database operations."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        """Get a user by ID."""

        statement = select(User).where(User.id == user_id)

        return self.db.scalar(statement)

    def get_by_email(self, email: str) -> User | None:
        """Get a user by email."""

        statement = select(User).where(User.email == email)

        return self.db.scalar(statement)

    def create(
        self,
        email: str,
        full_name: str,
        hashed_password: str,
    ) -> User:
        """Create a new user."""

        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        return user
    
    def update(
        self,
        *,
        user: User,
        full_name: str | None,
    ) -> User:
        """Update a user."""

        if full_name is not None:
            user.full_name = full_name

        self.db.commit()
        self.db.refresh(user)

        return user