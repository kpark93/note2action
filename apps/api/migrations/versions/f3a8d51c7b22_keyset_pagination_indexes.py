"""covering indexes for the keyset pagination walks

Revision ID: f3a8d51c7b22
Revises: e7f2b9c04a11
Create Date: 2026-09-03 14:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3a8d51c7b22"
down_revision: str | Sequence[str] | None = "e7f2b9c04a11"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """One btree per keyset: (user_id, sort key, id) lets each page walk
    seek straight to the cursor instead of scanning skipped rows."""
    op.create_index(
        "ix_action_items_user_due_id", "action_items", ["user_id", "due", "id"]
    )
    op.create_index(
        "ix_meetings_user_captured_id",
        "meetings",
        ["user_id", "captured_at", "id"],
    )


def downgrade() -> None:
    op.drop_index("ix_action_items_user_due_id", table_name="action_items")
    op.drop_index("ix_meetings_user_captured_id", table_name="meetings")
