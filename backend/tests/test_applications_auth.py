"""Unauthenticated access security tests for applications."""

from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tests.conftest import (
    auth_header,
    create_job,
    create_resume,
    create_user,
)


def test_unauthenticated_create_application_rejected(
    client: TestClient,
) -> None:
    """Create application without auth must be rejected."""

    response = client.post(
        "/api/v1/applications",
        json={
            "job_id": str(uuid4()),
            "resume_id": str(uuid4()),
        },
    )

    assert response.status_code in {401, 403}
    assert "access_token" not in response.json()


def test_unauthenticated_list_applications_rejected(
    client: TestClient,
) -> None:
    """List applications without auth must be rejected."""

    response = client.get("/api/v1/applications")

    assert response.status_code in {401, 403}


def test_unauthenticated_get_application_rejected(
    client: TestClient,
) -> None:
    """Get application without auth must be rejected."""

    response = client.get(f"/api/v1/applications/{uuid4()}")

    assert response.status_code in {401, 403}


def test_unauthenticated_update_application_rejected(
    client: TestClient,
) -> None:
    """Update application without auth must be rejected."""

    response = client.patch(
        f"/api/v1/applications/{uuid4()}",
        json={"status": "interview"},
    )

    assert response.status_code in {401, 403}


def test_unauthenticated_delete_application_rejected(
    client: TestClient,
) -> None:
    """Delete application without auth must be rejected."""

    response = client.delete(f"/api/v1/applications/{uuid4()}")

    assert response.status_code in {401, 403}


def test_unauthenticated_cannot_mutate_existing_application(
    client: TestClient,
    db_session: Session,
) -> None:
    """Missing auth must not update or delete an existing application."""

    user = create_user(db_session, email="app-unauth@example.com")
    job = create_job(db_session, user=user)
    resume = create_resume(db_session, user=user)
    headers = auth_header(user)

    created = client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": str(job.id), "resume_id": str(resume.id)},
    )
    assert created.status_code == 201
    application_id = created.json()["id"]

    patch_response = client.patch(
        f"/api/v1/applications/{application_id}",
        json={"status": "rejected"},
    )
    delete_response = client.delete(
        f"/api/v1/applications/{application_id}",
    )

    assert patch_response.status_code in {401, 403}
    assert delete_response.status_code in {401, 403}

    persisted = client.get(
        f"/api/v1/applications/{application_id}",
        headers=headers,
    )
    assert persisted.status_code == 200
    assert persisted.json()["status"] == "applied"
