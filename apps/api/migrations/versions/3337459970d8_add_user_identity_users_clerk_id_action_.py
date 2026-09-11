"""add user identity: users.clerk_id + action_items.user_id"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3337459970d8"
down_revision: str | Sequence[str] | None = "60c3336077e8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """NOT NULL three-step for populated tables: add nullable → backfill → tighten."""
    # users.clerk_id links a Clerk token to our row; unique, nullable until linked.
    op.add_column("users", sa.Column("clerk_id", sa.String(), nullable=True))
    op.create_unique_constraint("uq_users_clerk_id", "users", ["clerk_id"])

    # action_items.user_id — step 1: add, nullable for now.
    op.add_column("action_items", sa.Column("user_id", sa.Integer(), nullable=True))
    # Step 2: backfill from each item's meeting, which already knows its owner.
    op.execute(
        """
        UPDATE action_items
        SET user_id = meetings.user_id
        FROM meetings
        WHERE meetings.id = action_items.meeting_id
        """
    )
    # Step 3: every row now has an owner — tighten.
    op.alter_column("action_items", "user_id", nullable=False)
    op.create_foreign_key(
        "fk_action_items_user_id_users",
        "action_items",
        "users",
        ["user_id"],
        ["id"],
    )


def downgrade() -> None:
    """Remove user identity (reverse order of upgrade)."""
    op.drop_constraint(
        "fk_action_items_user_id_users", "action_items", type_="foreignkey"
    )
    op.drop_column("action_items", "user_id")
    op.drop_constraint("uq_users_clerk_id", "users", type_="unique")
    op.drop_column("users", "clerk_id")
