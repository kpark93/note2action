"""drop action_items.confidence — contract phase of the two-step removal

Revision ID: e7f2b9c04a11
Revises: c41d7aa25e90
Create Date: 2026-09-03 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7f2b9c04a11"
down_revision: str | Sequence[str] | None = "c41d7aa25e90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Contract step: c41d7aa25e90 already deployed, so no running code
    references the column in either direction — the drop is windowless."""
    op.drop_column("action_items", "confidence")


def downgrade() -> None:
    """Restores the column's shape only — the dropped values are gone;
    every row comes back as 0."""
    op.add_column(
        "action_items",
        sa.Column(
            "confidence",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
