import app.main as main_module
from fastapi.testclient import TestClient

from app.main import app
from app.repository import InMemoryItemRepository

# Tests always use the in-memory repository, regardless of .env.
main_module.repository = InMemoryItemRepository()
client = TestClient(app)


def test_list_items_returns_stub_items() -> None:
    response = client.get("/api/items")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 2
    assert {item["id"] for item in items} == {"1", "2"}
    assert all({"id", "title", "done"} <= item.keys() for item in items)
