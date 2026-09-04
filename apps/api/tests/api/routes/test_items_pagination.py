"""Keyset pagination over the items views — page walks, filters, cursors."""

from app.main import app
from fastapi.testclient import TestClient

from tests.conftest import AUTH

client = TestClient(app, headers=AUTH)


def seed_tasks() -> None:
    """Capture 5 items with mixed due dates (two undated), then promote all
    of them to Tasks — the fixture every tasks-view walk starts from."""
    client.post(
        "/api/meetings",
        json={
            "title": "Pagination seed",
            "rawNotes": "many items",
            "items": [
                {"title": "c-early", "owner": "Kyle", "priority": "High", "due": "2126-09-05", "note": ""},
                {"title": "a-later", "owner": "Dana", "priority": "Low", "due": "2126-09-20", "note": ""},
                {"title": "b-mid", "owner": "Kyle", "priority": "Medium", "due": "2126-09-10", "note": ""},
                {"title": "z-undated-1", "owner": "Kyle", "priority": "Low", "due": "", "note": ""},
                {"title": "z-undated-2", "owner": "Dana", "priority": "Low", "due": "", "note": ""},
            ],
        },
    )
    client.post("/api/items/save-to-tasks")


def walk(view: str, params: str = "") -> list[str]:
    """Follow nextCursor to exhaustion; returns every title in arrival order."""
    titles: list[str] = []
    cursor = ""
    for _ in range(10):  # hard stop: a broken cursor chain must not loop
        url = f"/api/items?view={view}&limit=2{params}"
        if cursor:
            url += f"&cursor={cursor}"
        body = client.get(url).json()
        titles += [item["title"] for item in body["items"]]
        if body["nextCursor"] is None:
            return titles
        cursor = body["nextCursor"]
    raise AssertionError("cursor chain never terminated")


def test_tasks_view_pages_in_due_order_with_undated_last() -> None:
    seed_tasks()
    titles = walk("tasks")
    # save-to-tasks also promoted the two seeded pending items — undated,
    # ids 1-2, so they lead the undated tail (id ASC within NULL dues).
    assert titles == [
        "c-early",
        "b-mid",
        "a-later",
        "Draft the project proposal",
        "Email the design mockups",
        "z-undated-1",
        "z-undated-2",
    ]


def test_tasks_pages_never_overlap_and_respect_limit() -> None:
    seed_tasks()
    first = client.get("/api/items?view=tasks&limit=2").json()
    assert len(first["items"]) == 2
    assert first["nextCursor"] is not None
    second = client.get(
        f"/api/items?view=tasks&limit=2&cursor={first['nextCursor']}"
    ).json()
    first_ids = {item["id"] for item in first["items"]}
    second_ids = {item["id"] for item in second["items"]}
    assert first_ids.isdisjoint(second_ids)


def test_tasks_view_filters_by_owner_server_side() -> None:
    seed_tasks()
    titles = walk("tasks", "&owner=Dana")
    assert titles == ["a-later", "z-undated-2"]


def test_history_view_returns_done_newest_completed_first() -> None:
    seed_tasks()
    # Close two items; both stamp today, so DESC falls back to id DESC.
    client.patch("/api/items/3", json={"status": "Done"})
    client.patch("/api/items/4", json={"status": "Done"})
    body = client.get("/api/items?view=history&limit=10").json()
    assert [item["id"] for item in body["items"]] == [4, 3]
    assert body["nextCursor"] is None


def test_review_view_returns_pending_unpaginated() -> None:
    body = client.get("/api/items?view=review").json()
    assert {item["id"] for item in body["items"]} == {1, 2}
    assert body["nextCursor"] is None


def test_invalid_cursor_is_a_422() -> None:
    response = client.get("/api/items?view=tasks&cursor=@@@not-a-cursor@@@")
    assert response.status_code == 422


def test_summary_counts_without_rows() -> None:
    seed_tasks()
    client.patch("/api/items/3", json={"status": "Done"})
    body = client.get("/api/items/summary").json()
    # save-to-tasks promoted the 2 seeded pending items too → review empty.
    # The Done item's due (2126) is after today → it counts as on time.
    assert body == {
        "done": 1,
        "open": 6,
        "review": 0,
        "total": 7,
        "onTime": 1,
        "meetings": 2,
    }


def test_get_single_item_and_404_for_unknown() -> None:
    assert client.get("/api/items/1").json()["id"] == 1
    assert client.get("/api/items/999").status_code == 404


def test_meetings_paginate_newest_first() -> None:
    for n in range(3):
        client.post(
            "/api/meetings",
            json={"title": f"m{n}", "rawNotes": "x", "items": []},
        )
    first = client.get("/api/meetings?limit=2&cursor=").json()
    assert len(first["meetings"]) == 2
    assert first["nextCursor"] is not None
    second = client.get(
        f"/api/meetings?limit=2&cursor={first['nextCursor']}"
    ).json()
    ids = [m["id"] for m in first["meetings"] + second["meetings"]]
    assert ids == sorted(ids, reverse=True)
