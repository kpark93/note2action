"""In-memory repository implementation — Python lists standing in for Postgres;
used by tests and Docker-free dev. Implements the same protocols.py shapes."""

from dataclasses import dataclass
from datetime import date, datetime, timezone

from app.schemas.items import ActionItem, ActionItemPatch
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    Meeting,
    MeetingDetail,
)

from .mappers import new_item
from .protocols import Repositories

# The in-memory fake's seeded user. Tests authenticate as this clerk id to
# see the seed data; any other id gets a fresh, empty account.
SEED_CLERK_ID = "user_seed"


@dataclass
class _MeetingRecord:
    """In-memory stand-in for a meetings row (itemCount stays derived)."""

    id: int
    user_id: int
    title: str
    raw_notes: str
    captured_at: str


class MemoryState:
    """All the fake's data in one place, shared by the three repos
    (mirrors how Postgres impls share one DB)."""

    def __init__(self) -> None:
        self.users: dict[str, int] = {SEED_CLERK_ID: 1}
        self.user_names: dict[int, str] = {1: "Seed User"}
        self.next_user_id = 2
        self.meetings: list[_MeetingRecord] = [
            _MeetingRecord(
                id=1,
                user_id=1,
                title="Kickoff sync",
                raw_notes="John to draft the project proposal. Jane emails the design mockups.",
                captured_at="2026-08-11T09:00:00+00:00",
            ),
        ]
        self.items: list[ActionItem] = [
            ActionItem(
                id=1,
                title="Draft the project proposal",
                meetingId=1,
                meeting="Kickoff sync",
                owner="John Doe",
                due=None,
                priority="High",
                saved=False,
                note=None,
                status="Not started",
                completed=None,
            ),
            ActionItem(
                id=2,
                title="Email the design mockups",
                meetingId=1,
                meeting="Kickoff sync",
                owner="Jane Doe",
                due=None,
                priority="High",
                saved=False,
                note=None,
                status="Not started",
                completed=None,
            ),
        ]
        # The seeds above already claim item ids 1-2 and meeting id 1.
        self.next_item_id = 3
        self.next_meeting_id = 2

    def item_count(self, meeting_id: int) -> int:
        """How many items belong to a meeting (fills Meeting.itemCount)."""
        return sum(1 for item in self.items if item.meetingId == meeting_id)

    def owns_meeting(self, user_id: int, meeting_id: int) -> bool:
        """Whether the given user owns the given meeting — the fake's
        stand-in for a Postgres RLS check."""
        return any(
            record.id == meeting_id and record.user_id == user_id
            for record in self.meetings
        )


class MemoryUserRepository:
    """The fake's UserRepository: a dict instead of a `users` table."""

    def __init__(self, state: MemoryState) -> None:
        self.state = state

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Look up or create the user; apply the same name laws as the
        Postgres impl (repositories/postgres/users.py)."""
        user_id = self.state.users.get(clerk_id)
        if user_id is None:
            user_id = self.state.next_user_id
            self.state.next_user_id += 1
            self.state.users[clerk_id] = user_id
            self.state.user_names[user_id] = name or "New user"
        elif name:
            # Clerk is the source of truth for the profile — keep ours fresh.
            self.state.user_names[user_id] = name
        return user_id


class MemoryItemRepository:
    """The fake's ItemRepository: filters the shared item list in Python
    instead of relying on Postgres RLS to filter rows."""

    def __init__(self, state: MemoryState) -> None:
        self.state = state

    def list_items(self, user_id: int) -> list[ActionItem]:
        """Every item whose meeting the given user owns."""
        return [
            item
            for item in self.state.items
            if self.state.owns_meeting(user_id, item.meetingId)
        ]

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None:
        """Applies a partial edit; stamps `completed` iff status is
        "Done" (server-side). None if missing or not the caller's."""
        for index, item in enumerate(self.state.items):
            if item.id == item_id and self.state.owns_meeting(
                user_id, item.meetingId
            ):
                changes = patch.model_dump(exclude_unset=True)
                updated = item.model_copy(update=changes)
                if "status" in changes:
                    completed = (
                        date.today().isoformat()
                        if updated.status == "Done"
                        else None
                    )
                    updated = updated.model_copy(
                        update={"completed": completed}
                    )
                self.state.items[index] = updated
                return updated
        return None

    def delete_item(self, user_id: int, item_id: int) -> bool:
        """Delete one item; False if missing or not the caller's."""
        for index, item in enumerate(self.state.items):
            if item.id == item_id and self.state.owns_meeting(
                user_id, item.meetingId
            ):
                del self.state.items[index]
                return True
        return False

    def save_all_to_tasks(self, user_id: int) -> int:
        """Mark every not-yet-saved, not-Done item as saved; returns the
        count changed."""
        updated = 0
        for index, item in enumerate(self.state.items):
            if (
                not item.saved
                and item.status != "Done"
                and self.state.owns_meeting(user_id, item.meetingId)
            ):
                self.state.items[index] = item.model_copy(
                    update={"saved": True}
                )
                updated += 1
        return updated


class MemoryMeetingRepository:
    """The fake's MeetingRepository: appends to the shared lists instead
    of running Postgres INSERTs inside a transaction."""

    def __init__(self, state: MemoryState) -> None:
        self.state = state

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse:
        """Persist a captured meeting and its extracted items together."""
        record = _MeetingRecord(
            id=self.state.next_meeting_id,
            user_id=user_id,
            title=request.title,
            raw_notes=request.rawNotes,
            captured_at=datetime.now(timezone.utc).isoformat(),
        )
        self.state.next_meeting_id += 1

        created: list[ActionItem] = []
        for extracted in request.items:
            created.append(
                new_item(
                    self.state.next_item_id, record.id, record.title, extracted
                )
            )
            self.state.next_item_id += 1

        self.state.meetings.append(record)
        self.state.items.extend(created)
        return CreateMeetingResponse(
            meeting=Meeting(
                id=record.id,
                title=record.title,
                capturedAt=record.captured_at,
                itemCount=len(created),
            ),
            items=created,
        )

    def list_meetings(self, user_id: int, limit: int) -> list[Meeting]:
        """The user's most recent meetings, newest first, capped at limit."""
        newest_first = sorted(
            (
                record
                for record in self.state.meetings
                if record.user_id == user_id
            ),
            key=lambda record: record.captured_at,
            reverse=True,
        )
        return [
            Meeting(
                id=record.id,
                title=record.title,
                capturedAt=record.captured_at,
                itemCount=self.state.item_count(record.id),
            )
            for record in newest_first[:limit]
        ]

    def get_meeting(
        self, user_id: int, meeting_id: int
    ) -> MeetingDetail | None:
        """One full meeting; None if missing or not the caller's."""
        for record in self.state.meetings:
            if record.id == meeting_id and record.user_id == user_id:
                return MeetingDetail(
                    id=record.id,
                    title=record.title,
                    rawNotes=record.raw_notes,
                    capturedAt=record.captured_at,
                    itemCount=self.state.item_count(record.id),
                )
        return None


def build_memory_repositories() -> Repositories:
    """Assembles the three in-memory repositories over one shared state;
    called by app/main.py when REPOSITORY != "postgres"."""
    state = MemoryState()
    return Repositories(
        users=MemoryUserRepository(state),
        items=MemoryItemRepository(state),
        meetings=MemoryMeetingRepository(state),
    )
