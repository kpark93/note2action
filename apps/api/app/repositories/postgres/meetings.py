"""The real MeetingRepository. Next hop: session.py → Postgres."""

from datetime import datetime, timezone

from sqlalchemy import and_, func, or_, select

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
    """Every method opens an rls_session; user_id also filters here."""

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse:
        """Meeting + items in one transaction; durable only at commit()."""
        with rls_session(user_id) as session:
            # user_id comes from the verified token, never the request body.
            captured_at = datetime.now(timezone.utc)

            meeting = MeetingRow(
                user_id=user_id,
                title=request.title,
                raw_notes=request.rawNotes,
                captured_at=captured_at,
            )
            session.add(meeting)
            # flush() sends the INSERT so Postgres assigns meeting.id; commit() = durable.
            session.flush()

            rows = [
                ActionItemRow(
                    meeting_id=meeting.id,
                    user_id=user_id,
                    title=item.title,
                    owner=item.owner,
                    due=item.due or None,
                    priority=item.priority,
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

    def list_meetings_page(
        self, user_id: int, cursor: dict | None, limit: int
    ) -> tuple[list[Meeting], dict | None]:
        """Keyset page by (captured_at, id) DESC; COUNT join, no N+1; limit+1 probes."""
        with rls_session(user_id) as session:
            q = (
                select(MeetingRow, func.count(ActionItemRow.id))
                .outerjoin(ActionItemRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(MeetingRow.user_id == user_id)
                .group_by(MeetingRow.id)
            )
            if cursor is not None:
                t = datetime.fromisoformat(cursor["t"])
                q = q.where(
                    or_(
                        MeetingRow.captured_at < t,
                        and_(
                            MeetingRow.captured_at == t,
                            MeetingRow.id < cursor["i"],
                        ),
                    )
                )
            q = q.order_by(MeetingRow.captured_at.desc(), MeetingRow.id.desc()).limit(
                limit + 1
            )
            rows = session.execute(q).all()
            has_more = len(rows) > limit
            page = [
                Meeting(
                    id=meeting.id,
                    title=meeting.title,
                    capturedAt=meeting.captured_at.isoformat(),
                    itemCount=count,
                )
                for meeting, count in rows[:limit]
            ]
            next_cursor = (
                {"t": page[-1].capturedAt, "i": page[-1].id}
                if has_more and page
                else None
            )
            return page, next_cursor

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None:
        """One full meeting with transcript; None if missing or not the caller's."""
        with rls_session(user_id) as session:
            row = session.get(MeetingRow, meeting_id)
            if row is None or row.user_id != user_id:
                return None
            item_rows = (
                session.execute(
                    select(ActionItemRow)
                    .where(ActionItemRow.meeting_id == meeting_id)
                    .order_by(ActionItemRow.id)
                )
                .scalars()
                .all()
            )
            items = [to_wire(item, row.title) for item in item_rows]
            return MeetingDetail(
                id=row.id,
                title=row.title,
                rawNotes=row.raw_notes,
                capturedAt=row.captured_at.isoformat(),
                itemCount=len(items),
                items=items,
            )
