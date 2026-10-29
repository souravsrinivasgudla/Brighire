"""Primary resume selection tests."""

from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.jobs.match_models import ResumeJobMatch
from app.resumes.repository import ResumeRepository
from app.resumes.service import ResumeService
from tests.conftest import auth_header, create_job, create_resume, create_user
from tests.test_upload_security import _upload_file


def test_first_upload_is_primary(
    db_session: Session,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The first stored resume for a user becomes primary."""

    monkeypatch.setattr(
        "app.resumes.service.extract_text_from_pdf",
        lambda _path: "Python engineer",
    )

    user = create_user(db_session, email="primary-first@example.com")
    service = ResumeService(
        repository=ResumeRepository(db_session),
        storage_directory=tmp_path / "resumes",
    )

    first = service.create_resume(
        user_id=user.id,
        file=_upload_file(b"%PDF-first"),
    )
    second = service.create_resume(
        user_id=user.id,
        file=_upload_file(b"%PDF-second"),
    )

    assert first.is_primary is True
    assert second.is_primary is False


def test_set_primary_switches_and_unsets_previous(
    client: TestClient,
    db_session: Session,
) -> None:
    """Only one resume stays primary after an explicit switch."""

    user = create_user(db_session, email="primary-switch@example.com")
    first = create_resume(db_session, user=user, filename="first.pdf")
    second = create_resume(db_session, user=user, filename="second.pdf")

    response = client.post(
        f"/api/v1/resumes/{second.id}/primary",
        headers=auth_header(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == str(second.id)
    assert body["is_primary"] is True

    listing = client.get("/api/v1/resumes", headers=auth_header(user))
    resumes = {item["id"]: item for item in listing.json()}
    assert resumes[str(first.id)]["is_primary"] is False
    assert resumes[str(second.id)]["is_primary"] is True
    assert listing.json()[0]["id"] == str(second.id)


def test_cannot_set_another_users_resume_as_primary(
    client: TestClient,
    db_session: Session,
) -> None:
    """Foreign primary updates must 404."""

    user_a = create_user(db_session, email="primary-a@example.com")
    user_b = create_user(db_session, email="primary-b@example.com")
    resume_b = create_resume(db_session, user=user_b)

    response = client.post(
        f"/api/v1/resumes/{resume_b.id}/primary",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Resume not found."


def test_missing_resume_primary_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    """Unknown resume ids do not leak existence."""

    user = create_user(db_session, email="primary-missing@example.com")

    response = client.post(
        f"/api/v1/resumes/{uuid4()}/primary",
        headers=auth_header(user),
    )

    assert response.status_code == 404


def test_deleting_primary_promotes_remaining_resume(
    client: TestClient,
    db_session: Session,
) -> None:
    """Deleting the primary resume promotes the newest remaining one."""

    user = create_user(db_session, email="primary-delete@example.com")
    older = create_resume(db_session, user=user, filename="older.pdf")
    newer = create_resume(db_session, user=user, filename="newer.pdf")

    client.post(
        f"/api/v1/resumes/{newer.id}/primary",
        headers=auth_header(user),
    )

    response = client.delete(
        f"/api/v1/resumes/{newer.id}",
        headers=auth_header(user),
    )

    assert response.status_code == 204

    listing = client.get("/api/v1/resumes", headers=auth_header(user))
    items = listing.json()
    assert len(items) == 1
    assert items[0]["id"] == str(older.id)
    assert items[0]["is_primary"] is True


def test_dashboard_uses_primary_resume_matches(
    client: TestClient,
    db_session: Session,
) -> None:
    """Dashboard match stats come from the primary resume only."""

    user = create_user(db_session, email="primary-dash@example.com")
    primary = create_resume(db_session, user=user, filename="primary.pdf")
    other = create_resume(db_session, user=user, filename="other.pdf")
    job_primary = create_job(db_session, user=user, title="Primary Role")
    job_other = create_job(db_session, user=user, title="Other Role")

    keep = ResumeJobMatch(
        resume_id=primary.id,
        job_id=job_primary.id,
        match_score=88,
        summary="Primary fit",
        matched_skills=["Python"],
        missing_skills=[],
        strengths=["APIs"],
        gaps=[],
        recommendations=[],
    )
    ignore = ResumeJobMatch(
        resume_id=other.id,
        job_id=job_other.id,
        match_score=99,
        summary="Should not appear",
        matched_skills=["Go"],
        missing_skills=[],
        strengths=["Systems"],
        gaps=[],
        recommendations=[],
    )
    db_session.add_all([keep, ignore])
    db_session.commit()

    response = client.get("/api/v1/dashboard", headers=auth_header(user))

    assert response.status_code == 200
    body = response.json()
    assert body["primary_resume_id"] == str(primary.id)
    assert body["primary_filename"] == "primary.pdf"
    assert body["resume_count"] == 2
    assert body["match_count"] == 1
    assert body["top_matches"][0]["job_title"] == "Primary Role"
    assert "Should not appear" not in response.text
    assert "Other Role" not in response.text
