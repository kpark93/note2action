"""FastAPI application: a health check and one example resource endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI

from .models import HealthResponse, ItemsResponse
from .repository import InMemoryItemRepository, ItemRepository

app = FastAPI(title="note2action API")

# Swap this for a DB-backed ItemRepository later — see app/repository.py.
repository: ItemRepository = InMemoryItemRepository()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="note2action-api",
        time=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/items", response_model=ItemsResponse)
def list_items() -> ItemsResponse:
    return ItemsResponse(items=repository.list_items())
