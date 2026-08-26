"""Resource ownership security tests."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def test_user_a_cannot_access_user_b_resume(
    client: TestClient,
    db_session: Session,
) -> None:
    """Foreign resume detail access must return 404."""

    user_a = create_user(db_session, email="a-resume@example.com")
    user_b = create_user(db_session, email="b-resume@example.com")
    resume_b = create_resume(db_session, user=user_b)

    response = client.get(
        f"/api/v1/resumes/{resume_b.id}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_user_a_cannot_analyze_user_b_resume(
    client: TestClient,
    db_session: Session,
) -> None:
    """Foreign resume analysis must return 404 without calling AI."""

    user_a = create_user(db_session, email="a-analyze@example.com")
    user_b = create_user(db_session, email="b-analyze@example.com")
    resume_b = create_resume(db_session, user=user_b)

    response = client.post(
        f"/api/v1/resumes/{resume_b.id}/analyze",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_user_a_cannot_access_user_b_job(
    client: TestClient,
    db_session: Session,
) -> None:
    """Foreign job detail access must return 404."""

    user_a = create_user(db_session, email="a-job@example.com")
    user_b = create_user(db_session, email="b-job@example.com")
    job_b = create_job(db_session, user=user_b)

    response = client.get(
        f"/api/v1/jobs/{job_b.id}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_user_a_cannot_match_own_resume_against_user_b_job(
    client: TestClient,
    db_session: Session,
) -> None:
    """Matching against another user's job must return 404."""

    user_a = create_user(db_session, email="a-match@example.com")
    user_b = create_user(db_session, email="b-match@example.com")
    resume_a = create_resume(db_session, user=user_a)
    job_b = create_job(db_session, user=user_b)

    response = client.post(
        f"/api/v1/jobs/{job_b.id}/match/{resume_a.id}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_missing_resume_returns_404_not_403(
    client: TestClient,
    db_session: Session,
) -> None:
    """Unknown resume IDs must return 404, not 403."""

    user = create_user(db_session, email="missing-resume@example.com")

    response = client.get(
        f"/api/v1/resumes/{uuid4()}",
        headers=auth_header(user),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_missing_job_returns_404_not_403(
    client: TestClient,
    db_session: Session,
) -> None:
    """Unknown job IDs must return 404, not 403."""

    user = create_user(db_session, email="missing-job@example.com")

    response = client.get(
        f"/api/v1/jobs/{uuid4()}",
        headers=auth_header(user),
    )

    assert response.status_code == 404
    assert response.status_code != 403
