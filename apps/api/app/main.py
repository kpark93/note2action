"""FastAPI application: a health check and one example resource endpoint."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException

from .schemas import (
    ActionItem,
    ActionItemPatch,
    CreateMeetingRequest,
    CreateMeetingResponse,
    HealthResponse,
    ItemsResponse,
    MeetingDetail,
    MeetingsResponse,
    SaveToTasksResponse,
)
from .repository import InMemoryItemRepository, ItemRepository, PostgresItemRepository
from .settings import settings

app = FastAPI(title="note2action API")

# Swap this for a DB-backed ItemRepository later — see app/repository.py.
repository: ItemRepository = (
    PostgresItemRepository()
    if settings.repository == "postgres"
    else InMemoryItemRepository()
)


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


@app.patch("/api/items/{item_id}", response_model=ActionItem)
def update_item(item_id: int, patch: ActionItemPatch) -> ActionItem:
    item = repository.update_item(item_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int) -> None:
    if not repository.delete_item(item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@app.post("/api/meetings", status_code=201, response_model=CreateMeetingResponse)
def create_meeting(request: CreateMeetingRequest) -> CreateMeetingResponse:
    return repository.create_meeting(request)


@app.get("/api/meetings", response_model=MeetingsResponse)
def list_meetings(limit: int = 3) -> MeetingsResponse:
    return MeetingsResponse(meetings=repository.list_meetings(limit))


@app.get("/api/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(meeting_id: int) -> MeetingDetail:
    meeting = repository.get_meeting(meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@app.post("/api/items/save-to-tasks", response_model=SaveToTasksResponse)
def save_to_tasks() -> SaveToTasksResponse:
    return SaveToTasksResponse(updated=repository.save_all_to_tasks())