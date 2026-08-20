"""add user identity: users.clerk_id + action_items.user_id

Revision ID: 3337459970d8
Revises: 60c3336077e8
Create Date: 2026-08-19 17:36:23.126198

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3337459970d8'
down_revision: Union[str, Sequence[str], None] = '60c3336077e8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user identity to the schema (a change, not a create).

    The three-step dance for adding a NOT NULL column to a table with
    existing rows: add it nullable → backfill → tighten to NOT NULL.
    Adding it NOT NULL directly would fail on every pre-existing row.
    """
    # users.clerk_id: links a verified Clerk token to our row. Unique so two
    # rows can never claim the same account; nullable so unlinked rows are ok.
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
        "fk_action_items_user_id_users", "action_items", "users", ["user_id"], ["id"]
    )


def downgrade() -> None:
    """Remove user identity (reverse order of upgrade)."""
    op.drop_constraint("fk_action_items_user_id_users", "action_items", type_="foreignkey")
    op.drop_column("action_items", "user_id")
    op.drop_constraint("uq_users_clerk_id", "users", type_="unique")
    op.drop_column("users", "clerk_id")
