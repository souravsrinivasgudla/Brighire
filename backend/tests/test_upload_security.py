"""Resume upload security tests."""

from io import BytesIO
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import UploadFile
from sqlalchemy.orm import Session
from starlette.datastructures import Headers

from app.core.config import settings
from app.resumes.repository import ResumeRepository
from app.resumes.service import ResumeService
from tests.conftest import create_user


def _upload_file(
    data: bytes,
    *,
    content_type: str = "application/pdf",
    filename: str = "resume.pdf",
) -> UploadFile:
    return UploadFile(
        file=BytesIO(data),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


def test_reject_file_larger_than_configured_max(
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Uploads above max_resume_size_mb must be rejected."""

    monkeypatch.setattr(settings, "max_resume_size_mb", 0)

    user = create_user(db_session, email="upload-size@example.com")
    service = ResumeService(
        repository=ResumeRepository(db_session),
        storage_directory=tmp_path / "resumes",
    )

    # Magic header passes; extra bytes trip the size check in the read loop.
    oversized = b"%PDF-" + b"x" * 16

    with pytest.raises(ValueError, match="too large") as exc_info:
        service.create_resume(
            user_id=user.id,
            file=_upload_file(oversized),
        )

    assert "Maximum size is 0 MB" in str(exc_info.value)
    assert list((tmp_path / "resumes").glob("*.pdf")) == []


def test_reject_non_pdf_even_when_content_type_is_pdf(
    db_session: Session,
    tmp_path: Path,
) -> None:
    """Content-Type application/pdf is not enough without PDF magic bytes."""

    user = create_user(db_session, email="upload-fake@example.com")
    service = ResumeService(
        repository=ResumeRepository(db_session),
        storage_directory=tmp_path / "resumes",
    )

    fake_pdf = b"This is plain text pretending to be a PDF"

    with pytest.raises(ValueError, match="not a valid PDF"):
        service.create_resume(
            user_id=user.id,
            file=_upload_file(
                fake_pdf,
                content_type="application/pdf",
            ),
        )

    assert list((tmp_path / "resumes").glob("*.pdf")) == []


def test_verify_pdf_magic_bytes_not_content_type(
    db_session: Session,
    tmp_path: Path,
) -> None:
    """Files without %PDF- magic must be rejected regardless of headers."""

    user = create_user(db_session, email="upload-magic@example.com")
    service = ResumeService(
        repository=ResumeRepository(db_session),
        storage_directory=tmp_path / "resumes",
    )

    with pytest.raises(ValueError, match="not a valid PDF"):
        service.create_resume(
            user_id=user.id,
            file=_upload_file(
                b"%DOC-" + str(uuid4()).encode(),
                content_type="application/pdf",
                filename="spoofed.pdf",
            ),
        )
