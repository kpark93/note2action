from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import AUTH

# A fresh in-memory repository per test comes from conftest.py (autouse).
# Default headers authenticate every request as the seeded user.
client = TestClient(app, headers=AUTH)


def test_list_items_returns_full_action_items() -> None:
    response = client.get("/api/items")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert {item["id"] for item in items} == {1, 2}
    assert all({"id", "meetingId", "meeting", "title", "owner", "due", "priority", "confidence", "saved", "note", "status", "completed"} <= item.keys() for item in items)


def test_patch_done_stamps_completed_server_side() -> None:
    response = client.patch("/api/items/1", json={"status": "Done"})
    assert response.status_code == 200
    item = response.json()
    assert item["status"] == "Done"
    # `completed` was not in the request body — the server must set it.
    assert item["completed"] is not None

    # Reverting the status must clear the stamp again (Done ⟺ completed).
    response = client.patch("/api/items/1", json={"status": "Not started"})
    assert response.status_code == 200
    assert response.json()["completed"] is None


def test_patch_unknown_id_returns_404() -> None:
    response = client.patch("/api/items/999", json={"status": "Done"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_delete_removes_item_and_returns_no_content() -> None:
    response = client.delete("/api/items/1")
    assert response.status_code == 204
    assert response.content == b""

    remaining = client.get("/api/items").json()["items"]
    assert {item["id"] for item in remaining} == {2}


def test_delete_unknown_id_returns_404() -> None:
    response = client.delete("/api/items/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_save_to_tasks_saves_all_pending_items() -> None:
    # Both seeds start pending (saved=false, not Done).
    response = client.post("/api/items/save-to-tasks")
    assert response.status_code == 200
    assert response.json() == {"updated": 2}

    items = client.get("/api/items").json()["items"]
    assert all(item["saved"] for item in items)

    # Nothing pending anymore — the batch is a valid no-op the second time.
    response = client.post("/api/items/save-to-tasks")
    assert response.json() == {"updated": 0}
