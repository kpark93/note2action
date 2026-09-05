"""The real ItemRepository — backed by meetings and action_items. Path §1
[hop 11/15]: services/items.py → here → session.py → Postgres → to_wire."""

from datetime import date

from sqlalchemy import and_, func, or_, select
from sqlalchemy import update as sql_update

from app.models import ActionItem as ActionItemRow
from app.models import Meeting as MeetingRow
from app.schemas.items import ActionItem, ActionItemPatch, ItemSummary

from ..mappers import to_wire
from .session import rls_session


class PostgresItemRepository:
    """Every method opens an rls_session (session.py) so RLS scopes
    each query; user_id also filters here — two layers of isolation."""

    def list_tasks_page(
        self,
        user_id: int,
        owner: str | None,
        status: str | None,
        priority: str | None,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Keyset page over (due ASC NULLS LAST, id ASC). Fetches limit+1
        rows: the extra row's existence is what proves there's a next page."""
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
            if owner is not None:
                q = q.where(ActionItemRow.owner == owner)
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
                    # Strictly after (d, id) among dated rows — or any undated
                    # row, since NULLS LAST puts the whole tail after them.
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
                {"d": page[-1].due, "i": page[-1].id}
                if has_more and page
                else None
            )
            return page, next_cursor

    def list_history_page(
        self,
        user_id: int,
        owner: str | None,
        cursor: dict | None,
        limit: int,
    ) -> tuple[list[ActionItem], dict | None]:
        """Keyset page over (completed DESC, id DESC); completed is never
        NULL for Done rows (ck_action_items_completed_iff_done)."""
        with rls_session(user_id) as session:
            q = (
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(
                    ActionItemRow.user_id == user_id,
                    ActionItemRow.status == "Done",
                )
            )
            if owner is not None:
                q = q.where(ActionItemRow.owner == owner)
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
        """One aggregate query per table — FILTER clauses over round trips."""
        with rls_session(user_id) as session:
            done_f = ActionItemRow.status == "Done"
            total, done, review, on_time = session.execute(
                select(
                    func.count(),
                    func.count().filter(done_f),
                    func.count().filter(
                        and_(~done_f, ActionItemRow.saved.is_(False))
                    ),
                    func.count().filter(
                        and_(
                            done_f,
                            or_(
                                ActionItemRow.due.is_(None),
                                ActionItemRow.completed <= ActionItemRow.due,
                            ),
                        )
                    ),
                ).where(ActionItemRow.user_id == user_id)
            ).one()
            meetings = session.execute(
                select(func.count()).where(MeetingRow.user_id == user_id)
            ).scalar_one()
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
        """Applies a partial edit; None if missing or not the caller's.
        Built before commit(): SET LOCAL identity dies at commit."""
        with rls_session(user_id) as session:
            row = session.get(ActionItemRow, item_id)
            # Someone else's row looks exactly like a missing one (→ 404) —
            # admitting otherwise would leak whose it is.
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
            # Before commit(): SET LOCAL identity dies at commit, so a
            # later read here would re-SELECT under no identity → RLS-denied.
            result = to_wire(row, meeting_title)
            session.commit()
            return result

    def delete_item(self, user_id: int, item_id: int) -> bool:
        """Delete one item; False if missing or not the caller's."""
        with rls_session(user_id) as session:
            row = session.get(ActionItemRow, item_id)
            if row is None or row.user_id != user_id:
                return False
            session.delete(row)
            session.commit()
            return True

    def save_all_to_tasks(self, user_id: int) -> int:
        """Mark every not-yet-saved, not-Done item as saved in one bulk
        UPDATE; returns the row count changed."""
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
