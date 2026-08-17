"""Resume business logic."""

from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile

from app.resumes.extractor import extract_text_from_pdf
from app.resumes.models import Resume
from app.resumes.repository import ResumeRepository


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
        """Store and process a resume."""

        if file.content_type != "application/pdf":
            raise ValueError("Only PDF files are supported.")

        original_filename = file.filename or "resume.pdf"

        safe_filename = f"{uuid4()}.pdf"

        file_path = self.storage_directory / safe_filename

        self.storage_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        with file_path.open("wb") as output:
            while chunk := file.file.read(1024 * 1024):
                output.write(chunk)

        extracted_text = extract_text_from_pdf(file_path)

        return self.repository.create(
            user_id=user_id,
            filename=original_filename,
            storage_path=str(file_path),
            extracted_text=extracted_text,
        )