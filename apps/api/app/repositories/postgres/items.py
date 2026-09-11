"""The real ItemRepository. Next hop: session.py → Postgres → to_wire."""

from datetime import date, datetime, timezone

from sqlalchemy import and_, func, or_, select
from sqlalchemy import delete as sql_delete
from sqlalchemy import update as sql_update

from app.models import ActionItem as ActionItemRow
from app.models import Meeting as MeetingRow
from app.schemas.items import ActionItem, ActionItemPatch, ItemSummary

from ..mappers import to_wire
from .session import rls_session


def _stamp_completed(client_day: str | None) -> date:
    """Done stamp: the client's day when within ±1 of UTC today, else UTC today."""
    today = datetime.now(timezone.utc).date()
    if client_day is None:
        return today
    try:
        day = date.fromisoformat(client_day)
    except ValueError:
        return today
    return day if abs((day - today).days) <= 1 else today


class PostgresItemRepository:
    """Every method opens an rls_session; user_id also filters — two isolation layers."""

    def list_tasks_page(
        self,
        user_id: int,
        status: str | None,
        priority: str | None,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Keyset page over (due ASC NULLS LAST, id ASC); limit+1 proves a next page."""
        with rls_session(user_id) as session:
            q = (
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.saved.is_(True),
                    ActionItemRow.status != "Done",
                )
            )
            if status is not None:
                q = q.where(ActionItemRow.status == status)
            if priority is not None:
                q = q.where(ActionItemRow.priority == priority)
            if cursor is not None:
                if cursor["d"] is None:
                    # Cursor already in the undated tail: only later undated ids.
                    q = q.where(
                        ActionItemRow.due.is_(None),
                        ActionItemRow.id > cursor["i"],
                    )
                else:
                    d = date.fromisoformat(cursor["d"])
                    # After (d, id) among dated rows, or any undated row (NULLS LAST).
                    q = q.where(
                        or_(
                            ActionItemRow.due > d,
                            and_(
                                ActionItemRow.due == d,
                                ActionItemRow.id > cursor["i"],
                            ),
                            ActionItemRow.due.is_(None),
                        )
                    )
            q = q.order_by(
                ActionItemRow.due.asc().nulls_last(), ActionItemRow.id.asc()
            ).limit(limit + 1)
            rows = session.execute(q).all()
            has_more = len(rows) > limit
            page = [to_wire(row, title) for row, title in rows[:limit]]
            next_cursor = (
                {"d": page[-1].due, "i": page[-1].id} if has_more and page else None
            )
            return page, next_cursor

    def list_history_page(
        self,
        user_id: int,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Keyset page over (completed DESC, id DESC); completed never NULL when Done."""
        with rls_session(user_id) as session:
            q = (
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.status == "Done",
                )
            )
            if cursor is not None:
                c = date.fromisoformat(cursor["c"])
                q = q.where(
                    or_(
                        ActionItemRow.completed < c,
                        and_(
                            ActionItemRow.completed == c,
                            ActionItemRow.id < cursor["i"],
                        ),
                    )
                )
            q = q.order_by(
                ActionItemRow.completed.desc(), ActionItemRow.id.desc()
            ).limit(limit + 1)
            rows = session.execute(q).all()
            has_more = len(rows) > limit
            page = [to_wire(row, title) for row, title in rows[:limit]]
            next_cursor = (
                {"c": page[-1].completed, "i": page[-1].id}
                if has_more and page
                else None
            )
            return page, next_cursor

    def list_review(self, user_id: int) -> list[ActionItem]:
        """Pending queue — unsaved, still open, in insertion (id) order."""
        with rls_session(user_id) as session:
            rows = session.execute(
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.saved.is_(False),
                    ActionItemRow.status != "Done",
                )
                .order_by(ActionItemRow.id.asc())
            ).all()
            return [to_wire(row, title) for row, title in rows]

    def get_item(self, user_id: int, item_id: int) -> ActionItem | None:
        """One item; None when missing or someone else's (route → 404)."""
        with rls_session(user_id) as session:
            result = session.execute(
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.id == item_id,
                )
            ).first()
            if result is None:
                return None
            row, title = result
            return to_wire(row, title)

    def count_summary(self, user_id: int) -> ItemSummary:
        """All counts in one round trip: FILTER buckets + a meetings subquery."""
        with rls_session(user_id) as session:
            done_f = ActionItemRow.status == "Done"
            meetings_sq = (
                select(func.count())
                .where(MeetingRow.user_id == user_id)
                .scalar_subquery()
            )
            total, done, review, on_time, meetings = session.execute(
                select(
                    func.count(),
                    func.count().filter(done_f),
                    func.count().filter(and_(~done_f, ActionItemRow.saved.is_(False))),
                    func.count().filter(
                        and_(
                            done_f,
                            or_(
                                ActionItemRow.due.is_(None),
                                ActionItemRow.completed <= ActionItemRow.due,
                            ),
                        )
                    ),
                    meetings_sq,
                ).where(ActionItemRow.user_id == user_id)
            ).one()
            return ItemSummary(
                done=done,
                open=total - done,
                review=review,
                total=total,
                onTime=on_time,
                meetings=meetings,
            )

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None:
        """Partial edit; None if missing or not the caller's."""
        with rls_session(user_id) as session:
            # One trip: the row with its meeting title joined in.
            hit = session.execute(
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(ActionItemRow.id == item_id)
            ).first()
            # Someone else's row looks exactly like a missing one (→ 404) — no leak.
            if hit is None or hit[0].user_id != user_id:
                return None
            row, meeting_title = hit
            changes = patch.model_dump(exclude_unset=True)
            # completedOn feeds the stamp below — it's not a column.
            completed_on = changes.pop("completedOn", None)
            for field, value in changes.items():
                setattr(row, field, value)
            if "status" in changes:
                row.completed = (
                    _stamp_completed(completed_on) if row.status == "Done" else None
                )
            # Built before commit(): the SET LOCAL identity dies at commit.
            result = to_wire(row, meeting_title)
            session.commit()
            return result

    def delete_item(self, user_id: int, item_id: int) -> bool:
        """Delete one item; False if missing or not the caller's (rowcount answers)."""
        with rls_session(user_id) as session:
            result = session.execute(
                sql_delete(ActionItemRow).where(
                    ActionItemRow.id == item_id,
                    ActionItemRow.user_id == user_id,
                )
            )
            session.commit()
            return result.rowcount > 0

    def save_all_to_tasks(self, user_id: int) -> int:
        """One bulk UPDATE saves every unsaved, not-Done item; returns rows changed."""
        with rls_session(user_id) as session:
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
