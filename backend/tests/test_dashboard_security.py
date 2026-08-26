"""Dashboard ownership and isolation security tests."""

from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.jobs.match_models import ResumeJobMatch
from app.resumes.analysis_models import ResumeAnalysis
from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def _create_analysis(
    db: Session,
    *,
    resume_id: UUID,
) -> ResumeAnalysis:
    analysis = ResumeAnalysis(
        resume_id=resume_id,
        overall_score=88,
        summary="Strong profile",
        skills=["Python"],
        strengths=["APIs"],
        weaknesses=["Cloud"],
        missing_skills=["K8s"],
        suggestions=["Add metrics"],
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def _create_match(
    db: Session,
    *,
    resume_id: UUID,
    job_id: UUID,
) -> ResumeJobMatch:
    match = ResumeJobMatch(
        resume_id=resume_id,
        job_id=job_id,
        match_score=91,
        summary="Excellent fit",
        matched_skills=["Python"],
        missing_skills=["Go"],
        strengths=["Backend"],
        gaps=["Frontend"],
        recommendations=["Ship more demos"],
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def test_unauthenticated_dashboard_rejected(
    client: TestClient,
) -> None:
    """Dashboard requires authentication."""

    response = client.get("/api/v1/dashboard")

    assert response.status_code in {401, 403}


def test_dashboard_does_not_leak_other_users_data(
    client: TestClient,
    db_session: Session,
) -> None:
    """User A dashboard must not include User B analytics or matches."""

    user_a = create_user(db_session, email="dash-a@example.com")
    user_b = create_user(db_session, email="dash-b@example.com")

    resume_b = create_resume(db_session, user=user_b)
    job_b = create_job(db_session, user=user_b, title="Secret Role")
    _create_analysis(db_session, resume_id=resume_b.id)
    match_b = _create_match(
        db_session,
        resume_id=resume_b.id,
        job_id=job_b.id,
    )

    response = client.get(
        "/api/v1/dashboard",
        headers=auth_header(user_a),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["resume_count"] == 0
    assert body["analysis_count"] == 0
    assert body["match_count"] == 0
    assert body["top_matches"] == []
    assert str(match_b.id) not in response.text
    assert "Secret Role" not in response.text
    assert str(resume_b.id) not in response.text


def test_user_a_cannot_access_user_b_resume_dashboard(
    client: TestClient,
    db_session: Session,
) -> None:
    """Foreign resume dashboard access must return 404."""

    user_a = create_user(db_session, email="dash-resume-a@example.com")
    user_b = create_user(db_session, email="dash-resume-b@example.com")
    resume_b = create_resume(db_session, user=user_b)
    job_b = create_job(db_session, user=user_b)
    _create_analysis(db_session, resume_id=resume_b.id)
    _create_match(
        db_session,
        resume_id=resume_b.id,
        job_id=job_b.id,
    )

    response = client.get(
        f"/api/v1/dashboard/resumes/{resume_b.id}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403
    assert response.json()["detail"] == "Resume not found."
    assert "Excellent fit" not in response.text
    assert "Strong profile" not in response.text


def test_user_can_access_own_resume_dashboard(
    client: TestClient,
    db_session: Session,
) -> None:
    """Owners can still load their own resume dashboard."""

    user = create_user(db_session, email="dash-own@example.com")
    resume = create_resume(db_session, user=user)
    job = create_job(db_session, user=user)
    _create_analysis(db_session, resume_id=resume.id)
    match = _create_match(
        db_session,
        resume_id=resume.id,
        job_id=job.id,
    )

    response = client.get(
        f"/api/v1/dashboard/resumes/{resume.id}",
        headers=auth_header(user),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["resume"]["id"] == str(resume.id)
    assert body["analysis"]["overall_score"] == 88
    assert body["match_count"] == 1
    assert body["top_matches"][0]["id"] == str(match.id)
