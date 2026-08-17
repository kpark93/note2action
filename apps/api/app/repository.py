"""Persistence lives behind a small interface so a real DB can be swapped in.

Today it's an in-memory list. To move to a database later, implement
`ItemRepository` with a DB-backed class and construct that in app/main.py —
nothing else has to change.
"""

from __future__ import annotations

from typing import Protocol

from .schemas import Item


class ItemRepository(Protocol):
    """The persistence boundary for items."""

    def list_items(self) -> list[Item]: ...


class InMemoryItemRepository:
    """In-memory item store, seeded with a couple of stub items."""

    def __init__(self) -> None:
        self._items: list[Item] = [
            Item(id="1", title="Draft the project proposal", done=False),
            Item(id="2", title="Email the design mockups", done=True),
        ]

    def list_items(self) -> list[Item]:
        return list(self._items)
