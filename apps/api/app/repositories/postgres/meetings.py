"""The real MeetingRepository — backed by meetings and action_items.
Called by services/meetings.py.
Path: services/meetings.py → [this file] → session.py → Postgres.
See request-paths.md §3.
"""

from datetime import date, datetime, timezone

from sqlalchemy import func, select

from app.models import ActionItem as ActionItemRow
from app.models import Meeting as MeetingRow
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    Meeting,
    MeetingDetail,
)

from ..mappers import to_wire
from .session import rls_session


class PostgresMeetingRepository:
    """Every method opens an rls_session (session.py) so RLS scopes
    queries to the caller's rows; user_id also filters here."""

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse:
        """Insert the meeting and its extracted items in one
        transaction; nothing is durable until commit() at the end."""
        with rls_session(user_id) as session:
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
        """The user's most recent meetings, newest first, with each
        item count computed by an outer-joined COUNT (no N+1 queries)."""
        with rls_session(user_id) as session:
            rows = session.execute(
                select(MeetingRow, func.count(ActionItemRow.id))
                .outerjoin(
                    ActionItemRow, ActionItemRow.meeting_id == MeetingRow.id
                )
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

    def get_meeting(
        self, user_id: int, meeting_id: int
    ) -> MeetingDetail | None:
        """One full meeting, transcript included; None if missing or
        not the caller's."""
        with rls_session(user_id) as session:
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
