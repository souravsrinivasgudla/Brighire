"""Resume business logic."""

from pathlib import Path
from uuid import UUID, uuid4

from app.shared.exceptions import (
    ResourceAccessDeniedError,
    ResourceNotFoundError,
)

from fastapi import UploadFile

from app.resumes.extractor import extract_text_from_pdf
from app.resumes.models import Resume
from app.resumes.repository import ResumeRepository
from app.core.config import settings


class ResumeService:
    """Service for resume operations."""

    def __init__(
        self,
        repository: ResumeRepository,
        storage_directory: Path,
    ) -> None:
        self.repository = repository
        self.storage_directory = storage_directory

    def create_resume(
        self,
        *,
        user_id: UUID,
        file: UploadFile,
    ) -> Resume:
        """Store and process a resume securely."""

        if file.content_type != "application/pdf":
            raise ValueError(
                "Only PDF files are supported."
            )

        max_size = (
            settings.max_resume_size_mb
            * 1024
            * 1024
        )

        original_filename = file.filename or "resume.pdf"

        safe_filename = f"{uuid4()}.pdf"

        file_path = self.storage_directory / safe_filename

        self.storage_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        total_size = 0

        try:
            with file_path.open("wb") as output:
                first_chunk = file.file.read(5)

                if first_chunk != b"%PDF-":
                    raise ValueError(
                        "The uploaded file is not a valid PDF."
                    )

                output.write(first_chunk)
                total_size += len(first_chunk)

                while chunk := file.file.read(
                    1024 * 1024
                ):
                    total_size += len(chunk)

                    if total_size > max_size:
                        raise ValueError(
                            "Resume file is too large. "
                            f"Maximum size is "
                            f"{settings.max_resume_size_mb} MB."
                        )

                    output.write(chunk)

            extracted_text = extract_text_from_pdf(
                file_path
            )

            return self.repository.create(
                user_id=user_id,
                filename=original_filename,
                storage_path=str(file_path),
                extracted_text=extracted_text,
            )

        except Exception:
            if file_path.exists():
                file_path.unlink()

            raise

    def get_user_resumes(
        self,
        *,
        user_id: UUID,
    ) -> list[Resume]:
        """Get all resumes belonging to a user."""

        return self.repository.get_by_user_id(
            user_id=user_id,
        )
    def get_resume(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> Resume:
        """Get a resume belonging to the authenticated user."""

        resume = self.repository.get_by_id(resume_id)

        if resume is None:
            raise ResourceNotFoundError(
                "Resume not found."
            )

        if resume.user_id != user_id:
            raise ResourceAccessDeniedError(
                "You do not have access to this resume."
            )

        return resume

    def delete_resume(
        self,
        *,
        resume_id: UUID,
        user_id: UUID,
    ) -> None:
        """Delete a user's resume and its stored file."""

        resume = self.get_resume(
            resume_id=resume_id,
            user_id=user_id,
        )

        storage_path = Path(resume.storage_path)

        self.repository.delete(
            resume=resume,
        )

        if storage_path.exists():
            storage_path.unlink()