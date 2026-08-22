from datetime import date

from sqlalchemy import select
from sqlalchemy import update as sql_update

from app.models import ActionItem as ActionItemRow
from app.models import Meeting as MeetingRow
from app.schemas.items import ActionItem, ActionItemPatch

from ..mappers import to_wire
from .session import rls_session


class PostgresItemRepository:
    """Store backed by the real meetings and action_items tables.

    Two layers enforce per-user isolation: the explicit user_id filters
    below (application layer) and Postgres RLS policies (database layer).
    The duplication is the point — defense in depth, either survives the
    other's bugs.
    """

    def list_items(self, user_id: int) -> list[ActionItem]:
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
        with rls_session(user_id) as session:
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
            # Build the response BEFORE commit: the RLS identity is SET LOCAL,
            # so it dies with the transaction — reading row attributes after
            # commit triggers a re-SELECT with no identity, which RLS rejects.
            result = to_wire(row, meeting_title)
            session.commit()
            return result

    def delete_item(self, user_id: int, item_id: int) -> bool:
        with rls_session(user_id) as session:
            row = session.get(ActionItemRow, item_id)
            if row is None or row.user_id != user_id:
                return False
            session.delete(row)
            session.commit()
            return True

    def save_all_to_tasks(self, user_id: int) -> int:
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
