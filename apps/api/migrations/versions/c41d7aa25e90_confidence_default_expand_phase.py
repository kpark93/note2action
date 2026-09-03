"""confidence server default — expand phase of the two-step removal

Revision ID: c41d7aa25e90
Revises: ba1b688e106a
Create Date: 2026-09-03 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c41d7aa25e90"
down_revision: str | Sequence[str] | None = "ba1b688e106a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Expand step: app code no longer reads or writes confidence, but the
    column must survive one deploy so still-running old tasks stay valid.
    The default lets new confidence-free INSERTs satisfy NOT NULL; a
    follow-up contract migration drops the column once this is deployed."""
    op.alter_column(
        "action_items", "confidence", server_default=sa.text("0")
    )


def downgrade() -> None:
    op.alter_column("action_items", "confidence", server_default=None)
