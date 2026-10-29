"""Resume API schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ResumeResponse(BaseModel):
    """Resume API response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    filename: str
    is_primary: bool
    extracted_text: str | None
    created_at: datetime
    updated_at: datetime