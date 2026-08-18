"""Persistence lives behind a small interface so a real DB can be swapped in.

Today it's an in-memory list. To move to a database later, implement
`ItemRepository` with a DB-backed class and construct that in app/main.py —
nothing else has to change.
"""

from __future__ import annotations

from typing import Protocol

from sqlalchemy import select
from .db import SessionLocal
from .models import ActionItem as ActionItemRow
from .schemas import ActionItem


class ItemRepository(Protocol):
    """The persistence boundary for items."""

    def list_items(self) -> list[ActionItem]: ...


class InMemoryItemRepository:
    """In-memory item store, seeded with a couple of stub items."""

    def __init__(self) -> None:
        self._items: list[ActionItem] = [
            ActionItem(id=1, title="Draft the project proposal", meetingId=1, owner="John Doe", due=None, priority="High", confidence=100, saved=False, note=None, status="Not started", completed=None),
            ActionItem(id=2, title="Email the design mockups", meetingId=1, owner="Jane Doe", due=None, priority="High", confidence=100, saved=False, note=None, status="Not started", completed=None),
        ]

    def list_items(self) -> list[ActionItem]:
        return list(self._items)

class PostgresItemRepository:
    """Item store backed by the real action_items table"""

    def list_items(self) -> list[ActionItem]:
        with SessionLocal() as session:
            rows = session.execute(select(ActionItemRow)).scalars().all()
            return [
                ActionItem(
                    id=row.id,
                    meetingId=row.meeting_id,
                    title=row.title,
                    owner=row.owner,
                    due=row.due.isoformat() if row.due else None,
                    priority=row.priority,
                    confidence=row.confidence,
                    saved=row.saved,
                    note=row.note,
                    status=row.status,
                    completed=row.completed.isoformat() if row.completed else None,
                )
                for row in rows
            ]

    
