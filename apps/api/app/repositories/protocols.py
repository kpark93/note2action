"""Persistence behind a small interface; app/main.py picks the implementation."""

from dataclasses import dataclass
from typing import Protocol

from app.schemas.items import ActionItem, ActionItemPatch, ItemSummary
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    Meeting,
    MeetingDetail,
)


class UserRepository(Protocol):
    """Maps a verified Clerk id onto our users.id, creating on first visit."""

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Clerk id → users.id; name refreshed on change, None never erases it."""
        ...


class ItemRepository(Protocol):
    """Item persistence; someone else's row looks missing (None/False → 404)."""

    def list_tasks_page(
        self,
        user_id: int,
        status: str | None,
        priority: str | None,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Saved open items, (due ASC NULLS LAST, id ASC); cursors are decoded dicts."""
        ...

    def list_history_page(
        self,
        user_id: int,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Done items in (completed DESC, id DESC) order; keyset payloads."""
        ...

    def list_review(self, user_id: int) -> list[ActionItem]:
        """Extracted-but-unsaved open items — the (bounded) Review queue."""
        ...

    def get_item(self, user_id: int, item_id: int) -> ActionItem | None: ...

    def count_summary(self, user_id: int) -> ItemSummary: ...

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None: ...

    def delete_item(self, user_id: int, item_id: int) -> bool: ...

    def save_all_to_tasks(self, user_id: int) -> int: ...


class MeetingRepository(Protocol):
    """Meeting persistence; same 404-not-403 law as ItemRepository."""

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse: ...

    def list_meetings_page(
        self, user_id: int, cursor: dict | None, limit: int
    ) -> tuple[list[Meeting], dict | None]:
        """Newest first by (captured_at DESC, id DESC); keyset payloads."""
        ...

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None: ...


@dataclass(frozen=True)
class Repositories:
    """The three repositories bundled; built once, reached via get_repositories()."""

    users: UserRepository
    items: ItemRepository
    meetings: MeetingRepository
