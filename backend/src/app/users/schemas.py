"""User request and response schemas."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Request schema for creating a user."""

    email: EmailStr
    full_name: str
    password: str = Field(
        min_length=8,
    )


class UserResponse(BaseModel):
    """Response schema for a user."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str
    is_active: bool

class UserUpdate(BaseModel):
    """Request schema for updating the current user."""

    full_name: str | None = None