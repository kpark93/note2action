"""Pins the request-id middleware: every response carries X-Request-ID and
emits one structured access-log line — the 'how do you debug prod' answer."""

import logging

from app.main import app
from starlette.testclient import TestClient

from tests.conftest import AUTH

client = TestClient(app)


def test_every_response_carries_a_request_id() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    request_id = response.headers["X-Request-ID"]
    assert len(request_id) == 12
    int(request_id, 16)  # hex or it raises


def test_request_ids_are_unique_per_request() -> None:
    first = client.get("/api/health").headers["X-Request-ID"]
    second = client.get("/api/health").headers["X-Request-ID"]
    assert first != second


def test_access_log_line_is_structured(caplog) -> None:
    with caplog.at_level(logging.INFO, logger="note2action.access"):
        response = client.get("/api/items", headers=AUTH)
    assert response.status_code == 200
    line = caplog.records[-1].getMessage()
    assert f"request_id={response.headers['X-Request-ID']}" in line
    assert "method=GET" in line
    assert "path=/api/items" in line
    assert "status=200" in line
    assert "duration_ms=" in line
    assert "user=user_" in line


def test_401s_are_logged_too(caplog) -> None:
    with caplog.at_level(logging.INFO, logger="note2action.access"):
        response = client.get("/api/items")
    assert response.status_code == 401
    line = caplog.records[-1].getMessage()
    assert "status=401" in line
    assert "user=-" in line
