"""Applications API tests."""

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)

VALID_STATUSES = (
    "applied",
    "reviewing",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
)


def test_create_application_success(
    client: TestClient,
    db_session: Session,
) -> None:
    """Authenticated user can create an application successfully."""

    user = create_user(db_session, email="app-create@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user),
        json={
            "job_id": str(job.id),
            "resume_id": str(resume.id),
            "cover_letter": "I am excited to apply.",
        },
    )

    assert response.status_code == 201
    payload = response.json()
    assert payload["user_id"] == str(user.id)
    assert payload["job_id"] == str(job.id)
    assert payload["resume_id"] == str(resume.id)
    assert payload["status"] == "applied"
    assert payload["cover_letter"] == "I am excited to apply."
    assert "id" in payload
    assert "created_at" in payload
    assert "updated_at" in payload


def test_create_application_defaults_status_to_applied(
    client: TestClient,
    db_session: Session,
) -> None:
    """Newly created applications default to status applied."""

    user = create_user(db_session, email="app-default@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user),
        json={
            "job_id": str(job.id),
            "resume_id": str(resume.id),
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == "applied"
    assert response.json()["cover_letter"] is None


def test_create_application_persists_cover_letter(
    client: TestClient,
    db_session: Session,
) -> None:
    """Cover letter is persisted and returned on create."""

    user = create_user(db_session, email="app-cover@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    cover_letter = "Please find my experience attached."

    create_response = client.post(
        "/api/v1/applications",
        headers=auth_header(user),
        json={
            "job_id": str(job.id),
            "resume_id": str(resume.id),
            "cover_letter": cover_letter,
        },
    )

    assert create_response.status_code == 201
    application_id = create_response.json()["id"]

    get_response = client.get(
        f"/api/v1/applications/{application_id}",
        headers=auth_header(user),
    )

    assert get_response.status_code == 200
    assert get_response.json()["cover_letter"] == cover_letter


def test_cannot_apply_to_job_owned_by_another_user(
    client: TestClient,
    db_session: Session,
) -> None:
    """Applying to another user's job returns 404."""

    user_a = create_user(db_session, email="app-job-a@example.com")
    user_b = create_user(db_session, email="app-job-b@example.com")
    resume_a = create_resume(db_session, user=user_a)
    job_b = create_job(db_session, user=user_b)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user_a),
        json={
            "job_id": str(job_b.id),
            "resume_id": str(resume_a.id),
        },
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_cannot_use_resume_owned_by_another_user(
    client: TestClient,
    db_session: Session,
) -> None:
    """Using another user's resume returns 404."""

    user_a = create_user(db_session, email="app-resume-a@example.com")
    user_b = create_user(db_session, email="app-resume-b@example.com")
    job_a = create_job(db_session, user=user_a)
    resume_b = create_resume(db_session, user=user_b)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user_a),
        json={
            "job_id": str(job_a.id),
            "resume_id": str(resume_b.id),
        },
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_create_application_nonexistent_job_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    """Nonexistent job returns 404."""

    user = create_user(db_session, email="app-missing-job@example.com")
    resume = create_resume(db_session, user=user)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user),
        json={
            "job_id": str(uuid4()),
            "resume_id": str(resume.id),
        },
    )

    assert response.status_code == 404


def test_create_application_nonexistent_resume_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    """Nonexistent resume returns 404."""

    user = create_user(db_session, email="app-missing-resume@example.com")
    job = create_job(db_session, user=user)

    response = client.post(
        "/api/v1/applications",
        headers=auth_header(user),
        json={
            "job_id": str(job.id),
            "resume_id": str(uuid4()),
        },
    )

    assert response.status_code == 404


def test_duplicate_application_returns_409(
    client: TestClient,
    db_session: Session,
) -> None:
    """Duplicate application for the same user/job returns 409."""

    user = create_user(db_session, email="app-dup@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)
    payload = {
        "job_id": str(job.id),
        "resume_id": str(resume.id),
    }

    first = client.post(
        "/api/v1/applications",
        headers=headers,
        json=payload,
    )
    second = client.post(
        "/api/v1/applications",
        headers=headers,
        json=payload,
    )

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.json()["detail"] == (
        "You have already applied to this job."
    )
    assert "integrity" not in second.json()["detail"].lower()
    assert "unique" not in second.json()["detail"].lower()

    listed = client.get(
        "/api/v1/applications",
        headers=headers,
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_concurrent_duplicate_application_returns_409(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """IntegrityError from a raced duplicate create maps to 409."""

    from app.applications.repository import ApplicationRepository

    user = create_user(db_session, email="app-race@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)
    payload = {
        "job_id": str(job.id),
        "resume_id": str(resume.id),
    }

    first = client.post(
        "/api/v1/applications",
        headers=headers,
        json=payload,
    )
    assert first.status_code == 201

    # Simulate a race where the pre-check does not see the existing row.
    monkeypatch.setattr(
        ApplicationRepository,
        "get_by_user_and_job",
        lambda self, **kwargs: None,
    )

    raced = client.post(
        "/api/v1/applications",
        headers=headers,
        json=payload,
    )

    assert raced.status_code == 409
    assert raced.json()["detail"] == (
        "You have already applied to this job."
    )
    assert "UNIQUE" not in raced.json()["detail"]
    assert "IntegrityError" not in raced.json()["detail"]

    # Restore lookup and confirm only one application remains.
    monkeypatch.undo()
    listed = client.get(
        "/api/v1/applications",
        headers=headers,
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_application_integrity_error_does_not_become_500(
    client: TestClient,
    db_session: Session,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Repository IntegrityError is converted to a controlled 409."""

    from sqlalchemy.exc import IntegrityError

    from app.applications.repository import ApplicationRepository

    user = create_user(db_session, email="app-integrity@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    def raise_integrity(self, **kwargs):
        raise IntegrityError("INSERT", {}, Exception("uq_user_job_application"))

    monkeypatch.setattr(
        ApplicationRepository,
        "get_by_user_and_job",
        lambda self, **kwargs: None,
    )
    monkeypatch.setattr(
        ApplicationRepository,
        "create",
        raise_integrity,
    )

    response = client.post(
        "/api/v1/applications",
        headers=headers,
        json={
            "job_id": str(job.id),
            "resume_id": str(resume.id),
        },
    )

    assert response.status_code == 409
    assert response.status_code != 500
    assert response.json()["detail"] == (
        "You have already applied to this job."
    )


def test_list_own_applications(
    client: TestClient,
    db_session: Session,
) -> None:
    """A user can list their own applications."""

    user = create_user(db_session, email="app-list@example.com")
    job_one = create_job(db_session, user=user, title="Role One")
    job_two = create_job(db_session, user=user, title="Role Two")
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    first = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job_one.id), "resume_id": str(resume.id)},
    )
    second = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job_two.id), "resume_id": str(resume.id)},
    )

    response = client.get(
        "/api/v1/applications",
        headers=headers,
    )

    assert first.status_code == 201
    assert second.status_code == 201
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 2
    assert {item["id"] for item in payload} == {
        first.json()["id"],
        second.json()["id"],
    }


def test_list_applications_does_not_expose_other_users(
    client: TestClient,
    db_session: Session,
) -> None:
    """Listing applications must not expose another user's applications."""

    user_a = create_user(db_session, email="app-list-a@example.com")
    user_b = create_user(db_session, email="app-list-b@example.com")

    job_a = create_job(db_session, user=user_a, title="A Role")
    resume_a = create_resume(db_session, user=user_a)
    job_b = create_job(db_session, user=user_b, title="B Role")
    resume_b = create_resume(db_session, user=user_b)

    create_a = client.post(
        "/api/v1/applications",
        headers=auth_header(user_a),
        json={"job_id": str(job_a.id), "resume_id": str(resume_a.id)},
    )
    create_b = client.post(
        "/api/v1/applications",
        headers=auth_header(user_b),
        json={"job_id": str(job_b.id), "resume_id": str(resume_b.id)},
    )

    response = client.get(
        "/api/v1/applications",
        headers=auth_header(user_a),
    )

    assert create_a.status_code == 201
    assert create_b.status_code == 201
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 1
    assert payload[0]["id"] == create_a.json()["id"]
    assert payload[0]["user_id"] == str(user_a.id)


def test_get_own_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """User can retrieve their own application."""

    user = create_user(db_session, email="app-get@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={
            "job_id": str(job.id),
            "resume_id": str(resume.id),
            "cover_letter": "Hello",
        },
    )
    application_id = created.json()["id"]

    response = client.get(
        f"/api/v1/applications/{application_id}",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["id"] == application_id
    assert response.json()["cover_letter"] == "Hello"


def test_cannot_get_another_users_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """User cannot retrieve another user's application."""

    user_a = create_user(db_session, email="app-get-a@example.com")
    user_b = create_user(db_session, email="app-get-b@example.com")
    job_b = create_job(db_session, user=user_b)
    resume_b = create_resume(db_session, user=user_b)

    created = client.post(
        "/api/v1/applications",
        headers=auth_header(user_b),
        json={"job_id": str(job_b.id), "resume_id": str(resume_b.id)},
    )

    response = client.get(
        f"/api/v1/applications/{created.json()['id']}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_update_own_application_status(
    client: TestClient,
    db_session: Session,
) -> None:
    """User can update their own application status."""

    user = create_user(db_session, email="app-update@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    application_id = created.json()["id"]

    response = client.patch(
        f"/api/v1/applications/{application_id}",
        headers=headers,
        json={"status": "interview"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "interview"


def test_update_application_accepts_valid_statuses(
    client: TestClient,
    db_session: Session,
) -> None:
    """All documented application statuses are accepted."""

    user = create_user(db_session, email="app-statuses@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    application_id = created.json()["id"]

    for status_value in VALID_STATUSES:
        response = client.patch(
            f"/api/v1/applications/{application_id}",
            headers=headers,
            json={"status": status_value},
        )
        assert response.status_code == 200
        assert response.json()["status"] == status_value

        persisted = client.get(
            f"/api/v1/applications/{application_id}",
            headers=headers,
        )
        assert persisted.status_code == 200
        assert persisted.json()["status"] == status_value


def test_update_application_invalid_status_returns_422(
    client: TestClient,
    db_session: Session,
) -> None:
    """Invalid application status is rejected by schema validation."""

    user = create_user(db_session, email="app-invalid-status@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    application_id = created.json()["id"]
    assert created.json()["status"] == "applied"

    response = client.patch(
        f"/api/v1/applications/{application_id}",
        headers=headers,
        json={"status": "not-a-real-status"},
    )

    assert response.status_code == 422
    body = response.json()
    assert "detail" in body

    persisted = client.get(
        f"/api/v1/applications/{application_id}",
        headers=headers,
    )
    assert persisted.status_code == 200
    assert persisted.json()["status"] == "applied"


def test_invalid_status_does_not_reach_service_layer(
    client: TestClient,
    db_session: Session,
) -> None:
    """Schema rejects invalid statuses before service mutation."""

    user = create_user(db_session, email="app-schema-status@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    application_id = created.json()["id"]

    response = client.patch(
        f"/api/v1/applications/{application_id}",
        headers=headers,
        json={"status": "accepted"},
    )

    assert response.status_code == 422
    assert response.status_code != 400
    assert response.status_code != 500

    listed = client.get(
        "/api/v1/applications",
        headers=headers,
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["status"] == "applied"
    assert listed.json()[0]["id"] == application_id


def test_cannot_update_another_users_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """User cannot update another user's application."""

    user_a = create_user(db_session, email="app-upd-a@example.com")
    user_b = create_user(db_session, email="app-upd-b@example.com")
    job_b = create_job(db_session, user=user_b)
    resume_b = create_resume(db_session, user=user_b)

    created = client.post(
        "/api/v1/applications",
        headers=auth_header(user_b),
        json={"job_id": str(job_b.id), "resume_id": str(resume_b.id)},
    )

    response = client.patch(
        f"/api/v1/applications/{created.json()['id']}",
        headers=auth_header(user_a),
        json={"status": "offer"},
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_delete_own_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """User can delete their own application."""

    user = create_user(db_session, email="app-delete@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )

    response = client.delete(
        f"/api/v1/applications/{created.json()['id']}",
        headers=headers,
    )

    assert response.status_code == 204


def test_cannot_delete_another_users_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """User cannot delete another user's application."""

    user_a = create_user(db_session, email="app-del-a@example.com")
    user_b = create_user(db_session, email="app-del-b@example.com")
    job_b = create_job(db_session, user=user_b)
    resume_b = create_resume(db_session, user=user_b)

    created = client.post(
        "/api/v1/applications",
        headers=auth_header(user_b),
        json={"job_id": str(job_b.id), "resume_id": str(resume_b.id)},
    )

    response = client.delete(
        f"/api/v1/applications/{created.json()['id']}",
        headers=auth_header(user_a),
    )

    assert response.status_code == 404
    assert response.status_code != 403


def test_get_application_after_deletion_returns_404(
    client: TestClient,
    db_session: Session,
) -> None:
    """After deletion, retrieving the application returns 404."""

    user = create_user(db_session, email="app-deleted-get@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    application_id = created.json()["id"]

    delete_response = client.delete(
        f"/api/v1/applications/{application_id}",
        headers=headers,
    )
    get_response = client.get(
        f"/api/v1/applications/{application_id}",
        headers=headers,
    )

    assert delete_response.status_code == 204
    assert get_response.status_code == 404
