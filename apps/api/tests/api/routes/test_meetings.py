from app.main import app
from fastapi.testclient import TestClient

from tests.conftest import AUTH

# A fresh in-memory repository per test comes from conftest.py (autouse).
# Default headers authenticate every request as the seeded user.
client = TestClient(app, headers=AUTH)


def test_create_meeting_persists_meeting_and_items() -> None:
    response = client.post(
        "/api/meetings",
        json={
            "title": "Sprint sync",
            "rawNotes": "Alice to ship the pricing page by Friday.",
            "items": [
                {
                    "title": "Ship pricing page",
                    "owner": "Alice",
                    "priority": "High",
                    "due": "2026-08-21",
                    "note": "from the notes",
                },
                {
                    "title": "Book retro room",
                    "owner": "Unassigned",
                    "priority": "Low",
                    "due": "",
                    "note": "",
                },
            ],
        },
    )
    assert response.status_code == 201
    body = response.json()

    assert body["meeting"]["title"] == "Sprint sync"
    assert body["meeting"]["itemCount"] == 2

    first, second = body["items"]
    # Birth defaults from api-design.md: Not started, unsaved, not completed.
    assert first["status"] == "Not started"
    assert first["saved"] is False
    assert first["completed"] is None
    assert first["due"] == "2026-08-21"
    # The extractor's '' ("none") must arrive as a wire null, not "".
    assert second["due"] is None
    assert second["note"] is None
    # Every created item belongs to the created meeting.
    assert {item["meetingId"] for item in body["items"]} == {
        body["meeting"]["id"]
    }

    # The new items join the one list every screen slices.
    items = client.get("/api/items").json()["items"]
    assert len(items) == 4


def test_create_meeting_invalid_body_returns_422() -> None:
    response = client.post(
        "/api/meetings", json={"title": "no rawNotes or items"}
    )
    assert response.status_code == 422


def _capture(title: str) -> int:
    """POST a one-item capture, return the new meeting's id."""
    response = client.post(
        "/api/meetings",
        json={
            "title": title,
            "rawNotes": f"Notes for {title}.",
            "items": [
                {
                    "title": f"Item from {title}",
                    "owner": "Kyle Park",
                    "priority": "Medium",
                    "due": "",
                    "note": "",
                }
            ],
        },
    )
    assert response.status_code == 201
    return response.json()["meeting"]["id"]


def test_list_meetings_newest_first_with_limit() -> None:
    _capture("First")
    _capture("Second")
    _capture("Third")

    response = client.get("/api/meetings")
    assert response.status_code == 200
    meetings = response.json()["meetings"]
    # Default limit is 3; the seed meeting is oldest, so it falls off the strip.
    assert [m["title"] for m in meetings] == ["Third", "Second", "First"]
    assert all(m["itemCount"] == 1 for m in meetings)

    response = client.get("/api/meetings?limit=2")
    assert [m["title"] for m in response.json()["meetings"]] == [
        "Third",
        "Second",
    ]


def test_get_meeting_returns_transcript() -> None:
    meeting_id = _capture("Standup")

    response = client.get(f"/api/meetings/{meeting_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Standup"
    assert body["rawNotes"] == "Notes for Standup."
    assert body["itemCount"] == 1


def test_get_unknown_meeting_returns_404() -> None:
    response = client.get("/api/meetings/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Meeting not found"
