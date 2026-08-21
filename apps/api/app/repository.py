"""Persistence lives behind a small interface so implementations can be swapped.

Two implementations exist: Postgres (production, chosen via REPOSITORY=postgres
in .env) and in-memory (tests and dev without Docker). app/main.py picks one;
nothing else knows which is running.
"""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Iterator, Protocol

from sqlalchemy import func, select, text
from sqlalchemy import update as sql_update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .core.db import SessionLocal
from .models import ActionItem as ActionItemRow
from .models import Meeting as MeetingRow
from .models import User
from .schemas import (
    ActionItem,
    ActionItemPatch,
    CreateMeetingRequest,
    CreateMeetingResponse,
    ExtractedItem,
    Meeting,
    MeetingDetail,
)


def to_wire(row: ActionItemRow, meeting_title: str) -> ActionItem:
    """DB row → wire schema. The meeting title is joined in by the caller."""
    return ActionItem(
        id=row.id,
        meetingId=row.meeting_id,
        meeting=meeting_title,
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


def _new_item(
    item_id: int, meeting_id: int, meeting_title: str, extracted: ExtractedItem
) -> ActionItem:
    """A freshly captured item, with the api-design.md birth defaults.

    `or None` translates the extractor's '' ("none") into a wire null.
    """
    return ActionItem(
        id=item_id,
        meetingId=meeting_id,
        meeting=meeting_title,
        title=extracted.title,
        owner=extracted.owner,
        due=extracted.due or None,
        priority=extracted.priority,
        confidence=extracted.confidence,
        saved=False,
        note=extracted.note or None,
        status="Not started",
        completed=None,
    )


# The in-memory fake's seeded user. Tests authenticate as this clerk id to
# see the seed data; any other id gets a fresh, empty account.
SEED_CLERK_ID = "user_seed"


class ItemRepository(Protocol):
    """The persistence boundary for items and their meetings.

    Every method takes the *verified* user id and answers only for that
    user's rows. Asking about someone else's row looks identical to asking
    about a row that doesn't exist (None/False → 404) — no existence leaks.
    """

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Map a verified Clerk user id to our users.id, creating on first visit.

        `name` comes from the token's custom session claim: used at creation
        (falling back to "New user"), and refreshed when Clerk's value
        changes. None means "token doesn't say" — never overwrite with it.
        """
        ...

    def list_items(self, user_id: int) -> list[ActionItem]: ...

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None: ...

    def delete_item(self, user_id: int, item_id: int) -> bool: ...

    def save_all_to_tasks(self, user_id: int) -> int: ...

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse: ...

    def list_meetings(self, user_id: int, limit: int) -> list[Meeting]: ...

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None: ...


@dataclass
class _MeetingRecord:
    """In-memory stand-in for a meetings row (itemCount stays derived)."""

    id: int
    user_id: int
    title: str
    raw_notes: str
    captured_at: str


class InMemoryItemRepository:
    """In-memory store, seeded with one user, one meeting, two sample items.

    Item ownership is derived from the item's meeting (the fake's single
    source of truth); Postgres denormalizes user_id onto items instead. Same
    observable behavior, different storage — exactly what the seam allows.
    """

    def __init__(self) -> None:
        self._users: dict[str, int] = {SEED_CLERK_ID: 1}
        self._user_names: dict[int, str] = {1: "Seed User"}
        self._next_user_id = 2
        self._meetings: list[_MeetingRecord] = [
            _MeetingRecord(
                id=1,
                user_id=1,
                title="Kickoff sync",
                raw_notes="John to draft the project proposal. Jane emails the design mockups.",
                captured_at="2026-08-11T09:00:00+00:00",
            ),
        ]
        self._items: list[ActionItem] = [
            ActionItem(id=1, title="Draft the project proposal", meetingId=1, meeting="Kickoff sync", owner="John Doe", due=None, priority="High", confidence=100, saved=False, note=None, status="Not started", completed=None),
            ActionItem(id=2, title="Email the design mockups", meetingId=1, meeting="Kickoff sync", owner="Jane Doe", due=None, priority="High", confidence=100, saved=False, note=None, status="Not started", completed=None),
        ]
        # The seeds above already claim item ids 1-2 and meeting id 1.
        self._next_item_id = 3
        self._next_meeting_id = 2

    def _item_count(self, meeting_id: int) -> int:
        return sum(1 for item in self._items if item.meetingId == meeting_id)

    def _owns_meeting(self, user_id: int, meeting_id: int) -> bool:
        return any(
            record.id == meeting_id and record.user_id == user_id
            for record in self._meetings
        )

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        user_id = self._users.get(clerk_id)
        if user_id is None:
            user_id = self._next_user_id
            self._next_user_id += 1
            self._users[clerk_id] = user_id
            self._user_names[user_id] = name or "New user"
        elif name:
            # Clerk is the source of truth for the profile — keep ours fresh.
            self._user_names[user_id] = name
        return user_id

    def list_items(self, user_id: int) -> list[ActionItem]:
        return [
            item for item in self._items if self._owns_meeting(user_id, item.meetingId)
        ]

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None:
        for index, item in enumerate(self._items):
            if item.id == item_id and self._owns_meeting(user_id, item.meetingId):
                changes = patch.model_dump(exclude_unset=True)
                updated = item.model_copy(update=changes)
                if "status" in changes:
                    completed = (
                        date.today().isoformat() if updated.status == "Done" else None
                    )
                    updated = updated.model_copy(update={"completed": completed})
                self._items[index] = updated
                return updated
        return None

    def delete_item(self, user_id: int, item_id: int) -> bool:
        for index, item in enumerate(self._items):
            if item.id == item_id and self._owns_meeting(user_id, item.meetingId):
                del self._items[index]
                return True
        return False

    def save_all_to_tasks(self, user_id: int) -> int:
        updated = 0
        for index, item in enumerate(self._items):
            if (
                not item.saved
                and item.status != "Done"
                and self._owns_meeting(user_id, item.meetingId)
            ):
                self._items[index] = item.model_copy(update={"saved": True})
                updated += 1
        return updated

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse:
        record = _MeetingRecord(
            id=self._next_meeting_id,
            user_id=user_id,
            title=request.title,
            raw_notes=request.rawNotes,
            captured_at=datetime.now(timezone.utc).isoformat(),
        )
        self._next_meeting_id += 1

        created: list[ActionItem] = []
        for extracted in request.items:
            created.append(
                _new_item(self._next_item_id, record.id, record.title, extracted)
            )
            self._next_item_id += 1

        self._meetings.append(record)
        self._items.extend(created)
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
        newest_first = sorted(
            (record for record in self._meetings if record.user_id == user_id),
            key=lambda record: record.captured_at,
            reverse=True,
        )
        return [
            Meeting(
                id=record.id,
                title=record.title,
                capturedAt=record.captured_at,
                itemCount=self._item_count(record.id),
            )
            for record in newest_first[:limit]
        ]

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None:
        for record in self._meetings:
            if record.id == meeting_id and record.user_id == user_id:
                return MeetingDetail(
                    id=record.id,
                    title=record.title,
                    rawNotes=record.raw_notes,
                    capturedAt=record.captured_at,
                    itemCount=self._item_count(record.id),
                )
        return None


@contextmanager
def _rls_session(user_id: int) -> Iterator[Session]:
    """A session whose transaction carries the caller's identity for RLS.

    set_config(..., is_local => true) is `SET LOCAL`: the value lives only
    until this transaction ends, so pooled connections can never leak one
    request's identity into the next. Postgres' policies compare every row
    against app.user_id — if any code path forgets to set it, the policies
    see NULL and return zero rows: forgetting fails closed, not open.
    """
    with SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', :uid, true)"),
            {"uid": str(user_id)},
        )
        yield session


class PostgresItemRepository:
    """Store backed by the real users, meetings, and action_items tables.

    Two layers enforce per-user isolation: the explicit user_id filters below
    (application layer) and Postgres RLS policies (database layer). The
    duplication is the point — defense in depth, either survives the other's
    bugs.
    """

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        with SessionLocal() as session:
            existing = session.execute(
                select(User).where(User.clerk_id == clerk_id)
            ).scalar_one_or_none()
            if existing is not None:
                # Clerk is the source of truth for the profile — keep ours
                # fresh; None means the token carries no name claim, so keep
                # whatever we have.
                if name and existing.name != name:
                    existing.name = name
                    session.commit()
                return existing.id
            user = User(name=name or "New user", clerk_id=clerk_id)
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                # Two first-requests raced to create the same user; the unique
                # constraint let exactly one win — read the winner's row.
                session.rollback()
                return session.execute(
                    select(User.id).where(User.clerk_id == clerk_id)
                ).scalar_one()
            return user.id

    def list_items(self, user_id: int) -> list[ActionItem]:
        with _rls_session(user_id) as session:
            rows = session.execute(
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(ActionItemRow.user_id == user_id)
            ).all()
            return [to_wire(row, title) for row, title in rows]

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None:
        with _rls_session(user_id) as session:
            row = session.get(ActionItemRow, item_id)
            # Someone else's row answers exactly like a missing row (→ 404):
            # admitting "it exists but isn't yours" would leak other users' ids.
            if row is None or row.user_id != user_id:
                return None
            changes = patch.model_dump(exclude_unset=True)
            # The wire speaks "YYYY-MM-DD" strings; the due column holds dates.
            if changes.get("due") is not None:
                changes["due"] = date.fromisoformat(changes["due"])
            for field, value in changes.items():
                setattr(row, field, value)
            if "status" in changes:
                row.completed = date.today() if row.status == "Done" else None
            meeting_title = session.get(MeetingRow, row.meeting_id).title
            session.commit()
            return to_wire(row, meeting_title)

    def delete_item(self, user_id: int, item_id: int) -> bool:
        with _rls_session(user_id) as session:
            row = session.get(ActionItemRow, item_id)
            if row is None or row.user_id != user_id:
                return False
            session.delete(row)
            session.commit()
            return True

    def save_all_to_tasks(self, user_id: int) -> int:
        with _rls_session(user_id) as session:
            result = session.execute(
                sql_update(ActionItemRow)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.saved.is_(False),
                    ActionItemRow.status != "Done",
                )
                .values(saved=True)
            )
            session.commit()
            return result.rowcount

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse:
        with _rls_session(user_id) as session:
            # user_id arrives from the verified token via the route — never
            # from the request body, and no more "first user in the table".
            captured_at = datetime.now(timezone.utc)

            meeting = MeetingRow(
                user_id=user_id,
                title=request.title,
                raw_notes=request.rawNotes,
                captured_at=captured_at,
            )
            session.add(meeting)
            # flush() sends the INSERT so Postgres assigns meeting.id, but the
            # transaction stays open — nothing is durable until commit().
            session.flush()

            rows = [
                ActionItemRow(
                    meeting_id=meeting.id,
                    user_id=user_id,
                    title=item.title,
                    owner=item.owner,
                    due=date.fromisoformat(item.due) if item.due else None,
                    priority=item.priority,
                    confidence=item.confidence,
                    saved=False,
                    note=item.note or None,
                    status="Not started",
                    completed=None,
                )
                for item in request.items
            ]
            session.add_all(rows)
            session.flush()

            response = CreateMeetingResponse(
                meeting=Meeting(
                    id=meeting.id,
                    title=meeting.title,
                    capturedAt=captured_at.isoformat(),
                    itemCount=len(rows),
                ),
                items=[to_wire(row, meeting.title) for row in rows],
            )
            session.commit()
            return response

    def list_meetings(self, user_id: int, limit: int) -> list[Meeting]:
        with _rls_session(user_id) as session:
            rows = session.execute(
                select(MeetingRow, func.count(ActionItemRow.id))
                .outerjoin(ActionItemRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(MeetingRow.user_id == user_id)
                .group_by(MeetingRow.id)
                .order_by(MeetingRow.captured_at.desc())
                .limit(limit)
            ).all()
            return [
                Meeting(
                    id=meeting.id,
                    title=meeting.title,
                    capturedAt=meeting.captured_at.isoformat(),
                    itemCount=count,
                )
                for meeting, count in rows
            ]

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None:
        with _rls_session(user_id) as session:
            row = session.get(MeetingRow, meeting_id)
            if row is None or row.user_id != user_id:
                return None
            count = session.execute(
                select(func.count())
                .select_from(ActionItemRow)
                .where(ActionItemRow.meeting_id == meeting_id)
            ).scalar_one()
            return MeetingDetail(
                id=row.id,
                title=row.title,
                rawNotes=row.raw_notes,
                capturedAt=row.captured_at.isoformat(),
                itemCount=count,
            )
