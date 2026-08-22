"""The real ItemRepository — backed by meetings and action_items.
Called by services/items.py.
Path §1 [hop 11/15]: services (hop 10) → [this file] → session.py →
Postgres → to_wire (hop 12). See request-paths.md §1, §2.
"""

from datetime import date

from sqlalchemy import select
from sqlalchemy import update as sql_update

from app.models import ActionItem as ActionItemRow
from app.models import Meeting as MeetingRow
from app.schemas.items import ActionItem, ActionItemPatch

from ..mappers import to_wire
from .session import rls_session


class PostgresItemRepository:
    """Every method opens an rls_session (session.py) so RLS scopes
    each query; user_id also filters here — two layers of isolation."""

    def list_items(self, user_id: int) -> list[ActionItem]:
        """Every item the given user owns, with its meeting's title."""
        with rls_session(user_id) as session:
            rows = session.execute(
                select(ActionItemRow, MeetingRow.title)
                .join(MeetingRow, ActionItemRow.meeting_id == MeetingRow.id)
                .where(ActionItemRow.user_id == user_id)
            ).all()
            return [to_wire(row, title) for row, title in rows]

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
