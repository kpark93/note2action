"""Endpoint tests against real Postgres — the whole server-side path:
middleware → route → service → repository → RLS → back out as JSON."""

import pytest
from app.main import app
from fastapi.testclient import TestClient

pytestmark = pytest.mark.integration

# FakeVerifier (tests/conftest.py): the bearer token IS the Clerk id.
ALICE = {"Authorization": "Bearer user_alice|Alice"}
BOB = {"Authorization": "Bearer user_bob|Bob"}

CAPTURE = {
    "title": "Sprint planning",
    "rawNotes": "raw meeting notes",
    "items": [
        {
            "title": "Ship the API",
            "owner": "Kyle",
            "priority": "High",
            "due": "",
            "note": "",
        },
        {
            "title": "Write tests",
            "owner": "Kyle",
            "priority": "Medium",
            "due": "2026-09-01",
            "note": "pytest",
        },
    ],
}

client = TestClient(app)


def test_capture_then_done_full_path():
    """POST a capture, PATCH an item to Done, read it back — the exact
    journey that 500'd before the build-response-before-commit fix."""
    created = client.post("/api/meetings", json=CAPTURE, headers=ALICE)
    assert created.status_code == 201
    item_id = created.json()["items"][0]["id"]

    done = client.patch(
        f"/api/items/{item_id}", json={"status": "Done"}, headers=ALICE
    )
    assert done.status_code == 200
    assert done.json()["status"] == "Done"
    # Not in the request body — the server stamps it.
    assert done.json()["completed"] is not None

    items = client.get("/api/items", headers=ALICE).json()["items"]
    target = next(i for i in items if i["id"] == item_id)
    assert target["status"] == "Done"


def test_cross_user_access_is_404_and_invisible():
    """Bob touching Alice's rows gets 404 (never 403 — a 403 would leak
    that the row exists) and sees an empty world of his own."""
    created = client.post("/api/meetings", json=CAPTURE, headers=ALICE)
    item_id = created.json()["items"][0]["id"]
    meeting_id = created.json()["meeting"]["id"]

    patched = client.patch(
        f"/api/items/{item_id}", json={"status": "Done"}, headers=BOB
    )
    assert patched.status_code == 404
    assert client.delete(f"/api/items/{item_id}", headers=BOB).status_code == 404
    assert (
        client.get(f"/api/meetings/{meeting_id}", headers=BOB).status_code
        == 404
    )
    assert client.get("/api/items", headers=BOB).json()["items"] == []


def test_save_to_tasks_endpoint_counts():
    client.post("/api/meetings", json=CAPTURE, headers=ALICE)

    first = client.post("/api/items/save-to-tasks", headers=ALICE)
    assert first.status_code == 200
    assert first.json()["updated"] == 2
    # Everything already saved — the second sweep finds nothing.
    assert client.post(
        "/api/items/save-to-tasks", headers=ALICE
    ).json()["updated"] == 0


def test_no_token_is_401():
    assert client.get("/api/items").status_code == 401
