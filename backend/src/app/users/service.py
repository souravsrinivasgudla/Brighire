"""User business logic."""

from uuid import UUID

from app.users.models import User
from app.users.repository import UserRepository
from app.users.schemas import UserCreate
from app.core.security import hash_password


class UserService:
    """Service for user business operations."""

    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def get_user(self, user_id: UUID) -> User | None:
        """Get a user by ID."""

        return self.repository.get_by_id(user_id)

    def create_user(self, data: UserCreate) -> User:
        """Create a new user."""

        existing_user = self.repository.get_by_email(data.email)

        if existing_user:
            raise ValueError("A user with this email already exists.")

        hashed_password = hash_password(data.password)

        return self.repository.create(
            email=str(data.email),
            full_name=data.full_name,
            hashed_password=hashed_password,
        )