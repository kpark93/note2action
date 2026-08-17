"""Pydantic schemas — the wire contract, mirrored in packages/shared (TS)."""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    time: str


class Item(BaseModel):
    id: str
    title: str
    done: bool


class ItemsResponse(BaseModel):
    items: list[Item]
