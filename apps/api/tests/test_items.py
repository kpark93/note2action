from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_items_returns_stub_items() -> None:
    response = client.get("/api/items")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert {item["id"] for item in items} == {"1", "2"}
    assert all({"id", "title", "done"} <= item.keys() for item in items)
