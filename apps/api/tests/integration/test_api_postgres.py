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


def test_tasks_keyset_walk_crosses_dated_undated_boundary():
    """Real-SQL page walk over the tasks view with limit=2: dated rows in
    due order, then the NULL-due tail, no overlaps, terminating cursor."""
    capture = {
        "title": "Pagination capture",
        "rawNotes": "notes",
        "items": [
            {"title": f"t{n}", "owner": "Kyle", "priority": "Low",
             "due": due, "note": ""}
            for n, due in enumerate(
                ["2026-09-12", "", "2026-09-02", "", "2026-09-22"]
            )
        ],
    }
    client.post("/api/meetings", json=capture, headers=ALICE)
    client.post("/api/items/save-to-tasks", headers=ALICE)

    seen: list[str] = []
    cursor = ""
    for _ in range(10):
        url = "/api/items?view=tasks&limit=2"
        if cursor:
            url += f"&cursor={cursor}"
        body = client.get(url, headers=ALICE).json()
        seen += [item["title"] for item in body["items"]]
        if body["nextCursor"] is None:
            break
        cursor = body["nextCursor"]
    assert seen == ["t2", "t0", "t4", "t1", "t3"]
    assert len(seen) == len(set(seen))


def test_pagination_views_are_user_scoped():
    """Bob's tasks view never shows Alice's rows, and his summary is empty —
    keyset queries ride the same RLS + user_id filters as everything else."""
    client.post(
        "/api/meetings",
        json={"title": "Alice only", "rawNotes": "x", "items": [
            {"title": "secret", "owner": "Kyle", "priority": "Low",
             "due": "", "note": ""}
        ]},
        headers=ALICE,
    )
    client.post("/api/items/save-to-tasks", headers=ALICE)

    bob_tasks = client.get("/api/items?view=tasks", headers=BOB).json()
    assert bob_tasks == {"items": [], "nextCursor": None}
    assert client.get("/api/items/summary", headers=BOB).json() == {
        "done": 0, "open": 0, "review": 0, "total": 0,
        "onTime": 0, "meetings": 0,
    }
