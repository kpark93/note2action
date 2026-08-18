"""Pydantic schemas — the wire contract, mirrored in packages/shared (TS)."""

from __future__ import annotations

from pydantic import BaseModel
from typing import Literal

Priority = Literal["High", "Medium", "Low"]
Status = Literal["Not started", "In progress", "Blocked", "Done"]

class ActionItem(BaseModel):
    id: int
    meetingId: int
    title: str
    owner: str
    due: str | None
    priority: Priority
    confidence: int
    saved: bool
    note: str | None
    status: Status
    completed: str | None

class HealthResponse(BaseModel):
    status: str
    service: str
    time: str


class ItemsResponse(BaseModel):
    items: list[ActionItem]


